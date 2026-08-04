// Accès PocketBase partagé par les endpoints du blog (aucun secret ici :
// seules les lectures publiques passent par ce module).
const PB_URL = (process.env.PB_URL || 'https://coastal-abagail-axelads-a874777e.koyeb.app').replace(/\/+$/, '');
const SITE_URL = 'https://axelgregoire.fr';

async function fetchPublishedArticles({ fields, maxItems = 1000, perPage = 200, sort = '-created' } = {}) {
  const items = [];
  let page = 1;
  let totalPages = 1;
  do {
    const params = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      sort,
      filter: '(published = true)',
    });
    if (fields) params.set('fields', fields);
    const res = await fetch(`${PB_URL}/api/collections/articles/records?${params.toString()}`);
    if (!res.ok) throw new Error(`PocketBase HTTP ${res.status}`);
    const data = await res.json();
    items.push(...data.items);
    totalPages = data.totalPages || 1;
    page += 1;
  } while (page <= totalPages && items.length < maxItems);
  return items.slice(0, maxItems);
}

// Les dates PocketBase utilisent un ESPACE ("YYYY-MM-DD HH:mm:ss.sssZ"), pas un "T".
function pbDate(str) {
  return new Date(String(str || '').replace(' ', 'T'));
}

module.exports = { PB_URL, SITE_URL, fetchPublishedArticles, pbDate };
