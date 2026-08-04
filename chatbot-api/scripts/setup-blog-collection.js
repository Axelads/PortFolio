#!/usr/bin/env node
/**
 * Création one-shot de la collection PocketBase `articles` (blog).
 *
 * Usage (PowerShell) :
 *   $env:PB_SUPERUSER_EMAIL="..." ; $env:PB_SUPERUSER_PASSWORD="..." ; node scripts/setup-blog-collection.js --smoke
 *
 * - Idempotent : si la collection existe, n'y touche pas.
 * - Sonde détecte PB moderne (>= 0.23, format "fields") vs legacy ("schema") et
 *   enchaîne des replis automatiques en cas d'erreur de validation.
 * - --smoke : crée un brouillon, vérifie qu'il est invisible en public, le supprime.
 */

const PB_URL = (process.env.PB_URL || 'https://coastal-abagail-axelads-a874777e.koyeb.app').replace(/\/+$/, '');
const EMAIL = process.env.PB_SUPERUSER_EMAIL;
const PASSWORD = process.env.PB_SUPERUSER_PASSWORD;
const SMOKE = process.argv.includes('--smoke');

const CATEGORIES = ['ia', 'javascript', 'react', 'css', 'outils'];

const RULES = {
  listRule: 'published = true || @request.auth.id != ""',
  viewRule: 'published = true || @request.auth.id != ""',
  createRule: '@request.auth.id != ""',
  updateRule: '@request.auth.id != ""',
  deleteRule: '@request.auth.id != ""',
};

const INDEXES = ['CREATE UNIQUE INDEX `idx_articles_slug` ON `articles` (`slug`)'];

// PB >= 0.23 : options à plat sur le champ, created/updated = champs autodate explicites
const MODERN_FIELDS = [
  { name: 'title', type: 'text', required: true, max: 200 },
  { name: 'slug', type: 'text', required: true, min: 3, max: 120, pattern: '^[a-z0-9-]+$' },
  { name: 'excerpt', type: 'text', max: 500 },
  { name: 'content', type: 'editor', required: true },
  { name: 'category', type: 'select', required: true, maxSelect: 1, values: CATEGORIES },
  { name: 'tags', type: 'json', maxSize: 100000 },
  { name: 'sources', type: 'json', maxSize: 100000 },
  { name: 'reading_time', type: 'number', onlyInt: true, min: 0 },
  { name: 'published', type: 'bool' },
  { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
  { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
];

// PB <= 0.22 : options imbriquées, created/updated implicites (ne pas les déclarer)
const LEGACY_SCHEMA = [
  { name: 'title', type: 'text', required: true, options: { max: 200 } },
  { name: 'slug', type: 'text', required: true, options: { min: 3, max: 120, pattern: '^[a-z0-9-]+$' } },
  { name: 'excerpt', type: 'text', required: false, options: { max: 500 } },
  { name: 'content', type: 'editor', required: true, options: {} },
  { name: 'category', type: 'select', required: true, options: { maxSelect: 1, values: CATEGORIES } },
  { name: 'tags', type: 'json', required: false, options: { maxSize: 100000 } },
  { name: 'sources', type: 'json', required: false, options: { maxSize: 100000 } },
  { name: 'reading_time', type: 'number', required: false, options: { noDecimal: true, min: 0 } },
  { name: 'published', type: 'bool', required: false, options: {} },
];

async function pb(method, path, token, body) {
  const res = await fetch(PB_URL + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* corps vide */ }
  return { status: res.status, json };
}

function fail(msg, detail) {
  console.error('\n❌ ' + msg);
  if (detail) console.error(JSON.stringify(detail, null, 2));
  process.exit(1);
}

async function authenticate() {
  if (!EMAIL || !PASSWORD) fail('PB_SUPERUSER_EMAIL / PB_SUPERUSER_PASSWORD manquants.');
  const modern = await pb('POST', '/api/collections/_superusers/auth-with-password', null, {
    identity: EMAIL, password: PASSWORD,
  });
  if (modern.status === 200 && modern.json && modern.json.token) {
    console.log('✔ Auth superuser OK — PocketBase MODERNE (>= 0.23, format "fields")');
    return { token: modern.json.token, legacy: false };
  }
  if (modern.status !== 404) {
    fail(`Auth _superusers refusée (HTTP ${modern.status}) — vérifie email/mot de passe superuser.`, modern.json);
  }
  const legacy = await pb('POST', '/api/admins/auth-with-password', null, {
    identity: EMAIL, password: PASSWORD,
  });
  if (legacy.status === 200 && legacy.json && legacy.json.token) {
    console.log('✔ Auth admin OK — PocketBase LEGACY (<= 0.22, format "schema")');
    return { token: legacy.json.token, legacy: true };
  }
  fail(`Aucun endpoint d'auth superuser/admin n'a accepté (moderne: ${modern.status}, legacy: ${legacy.status}).`, legacy.json);
}

function modernBody(fields) {
  return { name: 'articles', type: 'base', fields, indexes: INDEXES, ...RULES };
}

function legacyBody(withIndexes) {
  const body = { name: 'articles', type: 'base', schema: LEGACY_SCHEMA, ...RULES };
  if (withIndexes) body.indexes = INDEXES;
  else {
    // PB < 0.14 : pas d'indexes SQL — unique posé directement sur le champ slug
    body.schema = LEGACY_SCHEMA.map((f) =>
      f.name === 'slug' ? { ...f, unique: true } : f
    );
  }
  return body;
}

async function createCollection(token, legacyFirst) {
  // Chaque tentative est décrite pour un diagnostic lisible en cas d'échec.
  const attempts = legacyFirst
    ? [
        { label: 'legacy (schema + indexes)', body: legacyBody(true) },
        { label: 'legacy sans indexes (unique sur slug)', body: legacyBody(false) },
      ]
    : [
        { label: 'moderne (fields + autodate)', body: modernBody(MODERN_FIELDS) },
        {
          label: 'moderne sans autodate (created/updated gérés par le serveur)',
          body: modernBody(MODERN_FIELDS.filter((f) => f.type !== 'autodate')),
        },
        {
          label: 'moderne sans contraintes optionnelles',
          body: modernBody(
            MODERN_FIELDS.map(({ name, type, required, values, maxSelect, maxSize, onCreate, onUpdate }) => ({
              name, type,
              ...(required ? { required } : {}),
              ...(values ? { values, maxSelect } : {}),
              ...(maxSize ? { maxSize } : {}),
              ...(type === 'autodate' ? { onCreate, onUpdate } : {}),
            }))
          ),
        },
        { label: 'legacy (repli ultime)', body: legacyBody(true) },
      ];

  for (const attempt of attempts) {
    const res = await pb('POST', '/api/collections', token, attempt.body);
    if (res.status === 200) {
      console.log(`✔ Collection créée via le format : ${attempt.label}`);
      return res.json;
    }
    console.warn(`✖ Tentative "${attempt.label}" → HTTP ${res.status}`);
    if (res.json) console.warn(JSON.stringify(res.json, null, 2));
  }
  fail('Toutes les tentatives de création ont échoué (voir erreurs PocketBase ci-dessus).');
}

async function verify(token) {
  const col = await pb('GET', '/api/collections/articles', token);
  if (col.status !== 200) fail(`Relecture de la collection impossible (HTTP ${col.status}).`, col.json);
  const fields = col.json.fields || col.json.schema || [];
  const names = fields.map((f) => f.name);
  console.log('  Champs : ' + names.join(', '));

  const hasCreated = names.includes('created') || col.json.schema; // legacy : colonnes système implicites
  if (!hasCreated) {
    fail('Le champ `created` est absent — le tri -created du site ne fonctionnera pas. À corriger dans l\'admin PB.');
  }

  // Liste PUBLIQUE triée par -created (ce que fera le frontend)
  const pub = await pb('GET', '/api/collections/articles/records?sort=-created&perPage=1', null);
  if (pub.status !== 200) {
    fail(`La liste publique triée par -created répond HTTP ${pub.status} — règle listRule ou champ created à revoir.`, pub.json);
  }
  console.log('✔ Liste publique OK (tri -created accepté, règles en place)');
}

async function smokeTest(token) {
  console.log('— Smoke test…');
  const draft = {
    title: 'Smoke test setup', slug: 'smoke-test-setup',
    excerpt: 'test', content: '<p>ok</p>', category: 'outils',
    tags: [], sources: [], reading_time: 1, published: false,
  };
  const created = await pb('POST', '/api/collections/articles/records', token, draft);
  if (created.status !== 200) fail('Création du brouillon de test impossible.', created.json);

  const pub = await pb('GET', "/api/collections/articles/records?filter=(slug='smoke-test-setup')", null);
  const visible = pub.json && pub.json.items && pub.json.items.length > 0;
  const del = await pb('DELETE', `/api/collections/articles/records/${created.json.id}`, token);
  if (del.status !== 204) console.warn(`⚠ Suppression du brouillon de test : HTTP ${del.status} (à nettoyer à la main : id ${created.json.id})`);
  if (visible) fail('Un brouillon (published=false) est visible en public — listRule incorrecte !');
  console.log('✔ Smoke test OK : brouillon créé, invisible en public, supprimé');
}

(async () => {
  console.log(`PocketBase : ${PB_URL}`);
  const { token, legacy } = await authenticate();

  const existing = await pb('GET', '/api/collections/articles', token);
  if (existing.status === 200) {
    const fields = (existing.json.fields || existing.json.schema || []).map((f) => f.name);
    console.log('ℹ La collection `articles` existe déjà — aucune modification.');
    console.log('  Champs : ' + fields.join(', '));
    console.log('  listRule : ' + existing.json.listRule);
    if (SMOKE) await smokeTest(token);
    return;
  }
  if (existing.status !== 404) {
    fail(`Lecture de la collection inattendue (HTTP ${existing.status}).`, existing.json);
  }

  await createCollection(token, legacy);
  await verify(token);
  if (SMOKE) await smokeTest(token);
  console.log('\n✅ Collection `articles` prête. Pense à créer l\'utilisateur de service blog-bot dans `users`.');
})().catch((err) => fail('Erreur inattendue : ' + err.message));
