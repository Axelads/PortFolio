#!/usr/bin/env node
/**
 * Création one-shot de la collection PocketBase `chat_quota` (quota journalier du chatbot).
 *
 * Usage (PowerShell) :
 *   $env:PB_SUPERUSER_EMAIL="..." ; $env:PB_SUPERUSER_PASSWORD="..." ; node scripts/setup-chat-quota-collection.js
 *   Optionnel : $env:PB_SERVICE_EMAIL="<e-mail du compte de service>" restreint les règles à ce seul compte.
 *
 * - Idempotent : si la collection existe, n'y touche pas.
 * - Détecte PB moderne (>= 0.23, format "fields") vs legacy ("schema").
 * - Un enregistrement par (key, day) : key = 'global' ou 'ip:<hash>', count = nombre de messages du jour.
 */

const PB_URL = (process.env.PB_URL || 'https://coastal-abagail-axelads-a874777e.koyeb.app').replace(/\/+$/, '');
const EMAIL = process.env.PB_SUPERUSER_EMAIL;
const PASSWORD = process.env.PB_SUPERUSER_PASSWORD;
const SERVICE_EMAIL = process.env.PB_SERVICE_EMAIL;

const NAME = 'chat_quota';
const RULE = SERVICE_EMAIL ? `@request.auth.email = "${SERVICE_EMAIL}"` : '@request.auth.id != ""';
const RULES = { listRule: RULE, viewRule: RULE, createRule: RULE, updateRule: RULE, deleteRule: null };
const INDEXES = ['CREATE UNIQUE INDEX `idx_chat_quota_key_day` ON `chat_quota` (`key`, `day`)'];

const MODERN_FIELDS = [
  { name: 'key', type: 'text', required: true, max: 80 },
  { name: 'day', type: 'text', required: true, pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
  { name: 'count', type: 'number', onlyInt: true, min: 0 },
];
const LEGACY_SCHEMA = [
  { name: 'key', type: 'text', required: true, options: { max: 80 } },
  { name: 'day', type: 'text', required: true, options: { pattern: '^\\d{4}-\\d{2}-\\d{2}$' } },
  { name: 'count', type: 'number', required: false, options: { noDecimal: true, min: 0 } },
];

async function pb(method, path, token, body) {
  const res = await fetch(PB_URL + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: token } : {}) },
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
  const modern = await pb('POST', '/api/collections/_superusers/auth-with-password', null, { identity: EMAIL, password: PASSWORD });
  if (modern.status === 200 && modern.json && modern.json.token) return { token: modern.json.token, legacy: false };
  if (modern.status !== 404) fail(`Auth _superusers refusée (HTTP ${modern.status}).`, modern.json);
  const legacy = await pb('POST', '/api/admins/auth-with-password', null, { identity: EMAIL, password: PASSWORD });
  if (legacy.status === 200 && legacy.json && legacy.json.token) return { token: legacy.json.token, legacy: true };
  fail(`Aucun endpoint d'auth superuser/admin n'a accepté (moderne: ${modern.status}, legacy: ${legacy.status}).`, legacy.json);
}

async function createCollection(token, legacyFirst) {
  const modernBody = { name: NAME, type: 'base', fields: MODERN_FIELDS, indexes: INDEXES, ...RULES };
  const legacyBody = { name: NAME, type: 'base', schema: LEGACY_SCHEMA, indexes: INDEXES, ...RULES };
  const attempts = legacyFirst
    ? [{ label: 'legacy (schema)', body: legacyBody }, { label: 'moderne (fields)', body: modernBody }]
    : [{ label: 'moderne (fields)', body: modernBody }, { label: 'legacy (schema)', body: legacyBody }];
  for (const attempt of attempts) {
    const res = await pb('POST', '/api/collections', token, attempt.body);
    if (res.status === 200) {
      console.log(`✔ Collection créée via le format : ${attempt.label}`);
      return;
    }
    console.warn(`✖ Tentative "${attempt.label}" → HTTP ${res.status}`);
    if (res.json) console.warn(JSON.stringify(res.json, null, 2));
  }
  fail('Toutes les tentatives de création ont échoué.');
}

async function verify(token) {
  const col = await pb('GET', `/api/collections/${NAME}`, token);
  if (col.status !== 200) fail(`Relecture de la collection impossible (HTTP ${col.status}).`, col.json);
  const names = (col.json.fields || col.json.schema || []).map((f) => f.name);
  console.log('  Champs : ' + names.join(', '));
  console.log('  Règle  : ' + col.json.createRule);
  const pub = await pb('GET', `/api/collections/${NAME}/records?perPage=1`, null);
  const visible = pub.status === 200 && pub.json && pub.json.items && pub.json.items.length > 0;
  if (visible) fail('Des enregistrements sont lisibles sans authentification — règles à revoir.');
  console.log('✔ Lecture publique refusée ou vide (règles en place)');
}

(async () => {
  console.log(`PocketBase : ${PB_URL}`);
  const { token, legacy } = await authenticate();
  const existing = await pb('GET', `/api/collections/${NAME}`, token);
  if (existing.status === 200) {
    console.log(`ℹ La collection \`${NAME}\` existe déjà — aucune modification.`);
    await verify(token);
    return;
  }
  if (existing.status !== 404) fail(`Lecture de la collection inattendue (HTTP ${existing.status}).`, existing.json);
  await createCollection(token, legacy);
  await verify(token);
  console.log(`\n✅ Collection \`${NAME}\` prête. Le compte de service PB_SERVICE_EMAIL (déjà sur Vercel) l'alimente.`);
})().catch((err) => fail('Erreur inattendue : ' + err.message));
