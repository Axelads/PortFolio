// Endpoint de publication du blog — appelé par la routine Claude planifiée.
// Aucun appel Anthropic ici : validation stricte du payload puis enregistrement
// PocketBase avec le compte de service (secrets côté Vercel uniquement).
const { PB_URL } = require('../../lib/pb');

const CATEGORIES = ['ia', 'javascript', 'react', 'css', 'outils'];

// Balises interdites côté serveur (défense en profondeur — DOMPurify re-filtre au rendu)
const FORBIDDEN_HTML = /<\s*(script|iframe|object|embed|form|style|link|meta)\b|on\w+\s*=|javascript:/i;

function slugify(str) {
  return String(str)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function computeReadingTime(html) {
  const words = String(html).replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function validate(body) {
  const errors = [];
  const b = body || {};

  if (typeof b.title !== 'string' || b.title.trim().length < 5 || b.title.length > 200) {
    errors.push('title : chaîne de 5 à 200 caractères requise');
  }
  if (typeof b.content !== 'string' || b.content.length < 500 || b.content.length > 100000) {
    errors.push('content : HTML de 500 à 100000 caractères requis');
  }
  if (typeof b.content === 'string' && FORBIDDEN_HTML.test(b.content)) {
    errors.push('content : balise ou attribut interdit détecté (script/iframe/on*=/javascript:)');
  }
  if (!CATEGORIES.includes(b.category)) {
    errors.push(`category : doit être une de [${CATEGORIES.join(', ')}]`);
  }
  if (b.excerpt != null && (typeof b.excerpt !== 'string' || b.excerpt.length > 500)) {
    errors.push('excerpt : chaîne de 500 caractères max');
  }
  if (b.tags != null && (!Array.isArray(b.tags) || b.tags.length > 10 || b.tags.some((t) => typeof t !== 'string' || t.length > 40))) {
    errors.push('tags : tableau de 10 chaînes max (40 caractères chacune)');
  }
  if (b.sources != null) {
    const ok = Array.isArray(b.sources) && b.sources.length <= 6 && b.sources.every(
      (s) => s && typeof s.title === 'string' && typeof s.url === 'string' && /^https?:\/\//.test(s.url)
    );
    if (!ok) errors.push('sources : tableau de 6 objets {title, url http(s)} max');
  }
  return errors;
}

async function pbAuth() {
  const res = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity: process.env.PB_SERVICE_EMAIL,
      password: process.env.PB_SERVICE_PASSWORD,
    }),
  });
  if (!res.ok) throw new Error(`Auth PocketBase échouée (HTTP ${res.status})`);
  const data = await res.json();
  return data.token;
}

async function slugExists(token, slug) {
  const res = await fetch(
    `${PB_URL}/api/collections/articles/records?filter=${encodeURIComponent(`(slug='${slug}')`)}&fields=id&perPage=1`,
    { headers: { Authorization: token } }
  );
  if (!res.ok) return false; // en cas de doute, l'index unique tranche à la création
  const data = await res.json();
  return data.items && data.items.length > 0;
}

async function createArticle(token, record) {
  const res = await fetch(`${PB_URL}/api/collections/articles/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify(record),
  });
  const json = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, json };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = process.env.BLOG_PUBLISH_SECRET;
  if (!secret || !process.env.PB_SERVICE_EMAIL || !process.env.PB_SERVICE_PASSWORD) {
    return res.status(500).json({ error: 'Endpoint non configuré (variables d\'environnement manquantes)' });
  }
  if (req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const errors = validate(req.body);
  if (errors.length > 0) return res.status(400).json({ error: 'Payload invalide', details: errors });

  const b = req.body;
  const baseSlug = slugify(b.slug || b.title);
  if (baseSlug.length < 3) return res.status(400).json({ error: 'slug : trop court après normalisation' });

  try {
    const token = await pbAuth();

    // Déduplication : l'index unique reste l'autorité, la boucle gère les suffixes.
    let slug = baseSlug;
    for (let i = 2; i <= 5 && (await slugExists(token, slug)); i += 1) {
      slug = `${baseSlug}-${i}`;
    }

    const record = {
      title: b.title.trim(),
      slug,
      excerpt: (b.excerpt || '').trim(),
      content: b.content,
      category: b.category,
      tags: Array.isArray(b.tags) ? b.tags : [],
      sources: Array.isArray(b.sources) ? b.sources : [],
      reading_time: Number.isInteger(b.reading_time) && b.reading_time > 0 && b.reading_time <= 60
        ? b.reading_time
        : computeReadingTime(b.content),
      published: b.published !== false,
    };

    let result = await createArticle(token, record);
    if (!result.ok && result.json && result.json.data && result.json.data.slug) {
      // Collision d'index unique malgré le pré-contrôle : un dernier essai suffixé
      record.slug = `${baseSlug}-${Date.now() % 1000}`;
      result = await createArticle(token, record);
    }
    if (!result.ok) {
      console.error('PocketBase create error:', JSON.stringify(result.json));
      return res.status(502).json({ error: 'Création PocketBase refusée', details: result.json });
    }

    return res.status(201).json({ created: record.slug, id: result.json.id });
  } catch (error) {
    console.error('publish error:', error);
    return res.status(502).json({ error: error.message });
  }
};
