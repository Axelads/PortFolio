// Flux RSS 2.0 du blog (20 derniers articles publiés).
const { SITE_URL, fetchPublishedArticles, pbDate } = require('../../lib/pb');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cdata = (s) => `<![CDATA[${String(s).replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`;

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const items = await fetchPublishedArticles({
      fields: 'title,excerpt,slug,category,created',
      maxItems: 20,
      perPage: 20,
    });

    const rssItems = items
      .map((a) => {
        const url = `${SITE_URL}/blog/${a.slug}`;
        return (
          '    <item>\n' +
          `      <title>${cdata(a.title)}</title>\n` +
          `      <link>${url}</link>\n` +
          `      <guid isPermaLink="true">${url}</guid>\n` +
          `      <description>${cdata(a.excerpt || '')}</description>\n` +
          `      <category>${esc(a.category)}</category>\n` +
          `      <pubDate>${pbDate(a.created).toUTCString()}</pubDate>\n` +
          '    </item>'
        );
      })
      .join('\n');

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<rss version="2.0">\n' +
        '  <channel>\n' +
        '    <title>Blog — Axel Grégoire</title>\n' +
        `    <link>${SITE_URL}/blog</link>\n` +
        '    <description>Veille et articles techniques : IA, JavaScript, React, CSS et outils de développement.</description>\n' +
        '    <language>fr</language>\n' +
        `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n` +
        rssItems +
        '\n  </channel>\n</rss>\n'
    );
  } catch (error) {
    console.error('rss error:', error);
    return res.status(503).send('Service Unavailable');
  }
};
