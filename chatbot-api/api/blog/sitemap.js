// Sitemap dynamique des articles publiés — référencé depuis robots.txt du site
// (sitemap cross-domaine, supporté par Google/Bing).
const { SITE_URL, fetchPublishedArticles, pbDate } = require('../../lib/pb');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const items = await fetchPublishedArticles({ fields: 'slug,created,updated' });
    const day = (a) => pbDate(a.updated || a.created).toISOString().slice(0, 10);

    const urls = [];
    urls.push(
      `  <url>\n    <loc>${SITE_URL}/blog</loc>\n` +
        (items[0] ? `    <lastmod>${day(items[0])}</lastmod>\n` : '') +
        '    <changefreq>weekly</changefreq>\n  </url>'
    );
    for (const a of items) {
      urls.push(`  <url>\n    <loc>${SITE_URL}/blog/${a.slug}</loc>\n    <lastmod>${day(a)}</lastmod>\n  </url>`);
    }

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        urls.join('\n') +
        '\n</urlset>\n'
    );
  } catch (error) {
    console.error('sitemap error:', error);
    // 503 pour que les crawlers réessaient au lieu d'indexer un sitemap vide
    return res.status(503).send('Service Unavailable');
  }
};
