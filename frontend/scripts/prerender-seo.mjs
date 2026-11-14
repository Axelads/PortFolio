#!/usr/bin/env node
// Lancé après `npm run build` (script « postbuild », après csp-tableau-de-bord.js).
// Pré-rend les métadonnées de chaque route dans build/pages/ : le site reste une SPA servie en statique par o2switch,
// mais le HTML brut de chaque page porte désormais son title, sa description, son canonical, ses balises Open Graph
// et Twitter, son JSON-LD et un H1, pour les robots et les aperçus de partage qui n'exécutent pas JavaScript.
// .htaccess sert build/pages/<route>.html quand il existe, la coquille index.html sinon (routes connues), un vrai 404
// pour tout le reste. Génère aussi build/sitemap-blog.xml sur le domaine.
//
// Articles (/blog/<slug>) et projets (/Projet/<slug>) sont lus dans PocketBase au build : un article publié par la
// routine entre deux déploiements n'a pas encore sa page et retombe sur la coquille (comme avant), jusqu'au prochain
// `npm run build`. PocketBase injoignable = build en échec (déployer sans ces pages serait une régression silencieuse).
//
// Chaque balise injectée porte data-ssr : App.js les retire au montage et Helmet (src/components/Seo.js) prend la
// main. La table PAGES ci-dessous est le miroir des <Seo> de src/pages/*.js : les deux doivent rester alignées.
// L'article est aussi injecté en JSON (<script type="application/json" id="ssr-article">) : BlogArticle.js le lit
// au montage et s'affiche sans second aller-retour.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BUILD = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', process.env.BUILD_PATH || 'build');
const PAGES_DIR = path.join(BUILD, 'pages');
const SITE = 'https://axelgregoire.fr';
const POCKETBASE = (process.env.REACT_APP_POCKETBASE_URL || 'https://coastal-abagail-axelads-a874777e.koyeb.app').replace(/\/+$/, '');
const IMAGE_SITE = `${SITE}/images/partage/axel-gregoire-1200x630.png`;
const CATEGORIES = { ia: 'IA', javascript: 'JavaScript', react: 'React', css: 'CSS', outils: 'Outils' };

// Pages statiques — miroir des <Seo> de src/pages/*.js
const PAGES = {
  '/': {
    fichier: 'accueil',
    title: 'Axel Grégoire, développeur web full stack React et Node.js',
    description: "Sites web, applications mobiles et outils sur mesure en React, Node.js et PocketBase. Parcourez les projets d'Axel et contactez-le.",
    h1: 'Axel Grégoire',
    chapo: 'Développeur web full stack, freelance à Rougiers (Var) et à distance : sites web, applications mobiles et outils sur mesure.',
  },
  '/About': {
    title: 'À propos - Axel Grégoire | Mon parcours',
    description: "Découvrez le parcours d'Axel Grégoire : de la banque à l'entrepreneuriat, puis reconversion en développeur web full stack. Formation OpenClassrooms, React, Node.js.",
    h1: 'À propos de moi',
    chapo: "Le parcours d'Axel Grégoire, de la gestion d'entreprise au développement web.",
  },
  '/cv': {
    title: "CV d'Axel Grégoire, développeur full stack JavaScript",
    description: 'CV en ligne : React, Next.js, React Native et Node.js. Expériences, compétences et projets, avec version PDF à télécharger.',
    h1: 'Axel Grégoire — CV',
    chapo: 'Développeur full stack JavaScript : expériences, compétences et projets, version PDF à télécharger.',
  },
  '/Avis': {
    title: 'Avis et recommandations - Axel Grégoire',
    description: "Découvrez les avis et recommandations de collègues et mentors sur le travail d'Axel Grégoire, développeur web full stack.",
    h1: 'Ce que disent mes collègues et mentors',
    chapo: "Avis et recommandations sur le travail d'Axel Grégoire, développeur web full stack.",
  },
  '/carte': {
    title: 'Carte de visite - Axel Grégoire, développeur web',
    description: "Carte de visite numérique d'Axel Grégoire, développeur web : e-mail, portfolio, LinkedIn et GitHub.",
    h1: 'Carte de visite',
    chapo: 'Axel Grégoire, développeur web : e-mail, portfolio, LinkedIn et GitHub.',
  },
  '/blog': {
    title: 'Blog dev : React, CSS, JavaScript et IA | Axel Grégoire',
    description: "Veille technique en français sur React, CSS, JavaScript, les outils et l'IA, avec du code. Un nouvel article chaque semaine.",
    h1: 'Blog',
    chapo: 'Ma veille technique, en articles clairs et concrets : IA, JavaScript, React, CSS et outils du quotidien de développeur.',
  },
};

// ───────────────────────────────────────────── utilitaires ─────────────────────────────────────────────

const h = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
// JSON dans un <script> : aucun « < » ni separateur de ligne Unicode ne subsiste (impossible de refermer la balise)
const jsonSur = (v) => JSON.stringify(v).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, (c) => '\\u' + c.charCodeAt(0).toString(16));
const jsonLd = (data) => `<script type="application/ld+json" data-ssr>${jsonSur(data)}</script>`;
// Les dates PocketBase utilisent un ESPACE ("YYYY-MM-DD HH:mm:ss.sssZ")
const dateIso = (pb) => {
  const d = new Date(String(pb || '').replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};
const texteBrut = (html, max) => {
  const t = String(html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const coupe = t.slice(0, max - 1);
  const espace = coupe.lastIndexOf(' ');
  return `${(espace > max * 0.6 ? coupe.slice(0, espace) : coupe).replace(/[\s,;:.]+$/, '')}…`;
};
// Même règle que titreArticle() dans src/components/Seo.js
const titreArticle = (titre) => (titre.length <= 45 ? `${titre} | Axel Grégoire` : titre);
const filAriane = (etapes) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [['Accueil', `${SITE}/`], ...etapes].map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })),
});

async function pbRecords(collection, params) {
  const url = `${POCKETBASE}/api/collections/${collection}/records?${new URLSearchParams(params)}`;
  const r = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`PocketBase ${collection} : HTTP ${r.status}`);
  return r.json();
}
async function pbTous(collection, params) {
  const items = [];
  for (let page = 1, pages = 1; page <= pages && page <= 20; page += 1) {
    const json = await pbRecords(collection, { ...params, page: String(page), perPage: '200' });
    items.push(...json.items);
    pages = json.totalPages || 1;
  }
  return items;
}

// ───────────────────────────────────────────── injection ─────────────────────────────────────────────

function injecter(coquille, meta) {
  let html = coquille.replace(/<title>.*?<\/title>/s, `<title>${h(meta.title)}</title>`);
  if (meta.noindex) {
    // On remplace la balise robots statique plutôt que d'en ajouter une seconde (sans data-ssr : elle reste).
    html = html.replace(/<meta name="robots" content="[^"]*"\s*\/?>/, '<meta name="robots" content="noindex, nofollow"/>');
  }
  const b = [];
  if (meta.description) b.push(`<meta name="description" content="${h(meta.description)}" data-ssr/>`);
  if (!meta.noindex) {
    if (meta.url) b.push(`<link rel="canonical" href="${h(meta.url)}" data-ssr/>`);
    b.push(`<meta property="og:title" content="${h(meta.title)}" data-ssr/>`);
    if (meta.description) b.push(`<meta property="og:description" content="${h(meta.description)}" data-ssr/>`);
    b.push(`<meta property="og:type" content="${h(meta.type || 'website')}" data-ssr/>`);
    if (meta.url) b.push(`<meta property="og:url" content="${h(meta.url)}" data-ssr/>`);
    const image = meta.image || IMAGE_SITE;
    b.push(`<meta property="og:image" content="${h(image)}" data-ssr/>`);
    if (image.startsWith(`${SITE}/images/partage/`)) {
      b.push('<meta property="og:image:width" content="1200" data-ssr/>', '<meta property="og:image:height" content="630" data-ssr/>');
    }
    b.push(`<meta property="og:image:alt" content="${h(meta.h1 || meta.title)}" data-ssr/>`);
    if (meta.type === 'article') {
      b.push(`<meta property="article:published_time" content="${h(meta.publie)}" data-ssr/>`);
      b.push(`<meta property="article:modified_time" content="${h(meta.modifie)}" data-ssr/>`);
      b.push(`<meta property="article:author" content="${SITE}" data-ssr/>`);
    }
    b.push(`<meta name="twitter:title" content="${h(meta.title)}" data-ssr/>`);
    if (meta.description) b.push(`<meta name="twitter:description" content="${h(meta.description)}" data-ssr/>`);
    b.push(`<meta name="twitter:image" content="${h(image)}" data-ssr/>`);
    for (const bloc of meta.jsonld || []) b.push(jsonLd(bloc));
  }
  if (meta.hydratation) b.push(`<script type="application/json" id="${meta.hydratation.id}">${jsonSur(meta.hydratation.donnees)}</script>`);
  html = html.replace('</title>', `</title>${b.join('')}`);
  if (meta.h1) {
    const bloc = `<div class="ssr${meta.classe ? ` ${meta.classe}` : ''}" data-ssr><h1>${h(meta.h1)}</h1>${meta.chapo ? `<p>${h(meta.chapo)}</p>` : ''}</div>`;
    const avant = html;
    html = html.replace('<div id="root"></div>', `<div id="root">${bloc}</div>`);
    if (html === avant) throw new Error('<div id="root"></div> introuvable dans build/index.html');
  }
  return html;
}

// ───────────────────────────────────────────── routes ─────────────────────────────────────────────

function pageStatique(chemin, p) {
  const url = `${SITE}${chemin}`;
  return { ...p, url, type: 'website', image: IMAGE_SITE, jsonld: chemin === '/' ? [] : [filAriane([[p.h1, url]])] };
}

function pageArticle(a) {
  const titre = String(a.title || '').trim();
  const url = `${SITE}/blog/${a.slug}`;
  const categorie = CATEGORIES[a.category] ? a.category : 'outils';
  const image = `${SITE}/images/partage/blog-${categorie}-1200x630.png`;
  const description = String(a.excerpt || '').trim() || texteBrut(a.content, 160);
  const publie = dateIso(a.created);
  const modifie = dateIso(a.updated || a.created);
  const blogPosting = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: titre,
    description,
    image: [image],
    datePublished: publie,
    dateModified: modifie,
    inLanguage: 'fr',
    author: { '@type': 'Person', name: 'Axel Grégoire', url: SITE },
    publisher: { '@type': 'Person', name: 'Axel Grégoire', url: SITE },
    mainEntityOfPage: url,
    articleSection: CATEGORIES[a.category] || a.category,
    ...(Array.isArray(a.tags) && a.tags.length ? { keywords: a.tags.map(String).join(', ') } : {}),
  };
  return {
    title: titreArticle(titre),
    description,
    url,
    type: 'article',
    image,
    h1: titre,
    chapo: description,
    classe: 'blog-article',
    publie,
    modifie,
    jsonld: [blogPosting, filAriane([['Blog', `${SITE}/blog`], [titre, url]])],
    hydratation: { id: 'ssr-article', donnees: a },
  };
}

function pageProjet(p) {
  const nom = String(p.name || 'Projet').trim();
  const url = `${SITE}/Projet/${encodeURIComponent(p.slug)}`;
  const description = texteBrut(p.resume, 160) || `Découvrez le projet ${nom} réalisé par Axel Grégoire.`;
  const premiere = Array.isArray(p.imageUrls) ? String(p.imageUrls[0] || '').replace(/^http:\/\//, 'https://') : '';
  const image = /^https:\/\/[^\s"<>]+$/.test(premiere) ? premiere : IMAGE_SITE;
  return {
    title: `${nom} - Projet | Axel Grégoire`,
    description,
    url,
    type: 'website',
    image,
    h1: nom,
    chapo: description,
    jsonld: [filAriane([['Projets', `${SITE}/#projects`], [nom, url]])],
  };
}

const PAGE_404 = {
  title: 'Page introuvable | Axel Grégoire',
  description: "Cette page n'existe pas ou plus sur axelgregoire.fr.",
  noindex: true,
  h1: '404',
  chapo: "Oups, la page que vous recherchez n'existe pas.",
};

// ───────────────────────────────────────────── exécution ─────────────────────────────────────────────

const coquille = fs.readFileSync(path.join(BUILD, 'index.html'), 'utf8');
if (!coquille.includes('<div id="root"></div>') || !/<title>.*?<\/title>/s.test(coquille)) {
  console.error('✗ build/index.html inattendu (title ou #root introuvable) : pré-rendu annulé');
  process.exit(1);
}
fs.rmSync(PAGES_DIR, { recursive: true, force: true });
const ecrire = (relatif, html) => {
  const f = path.join(PAGES_DIR, `${relatif}.html`);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
};

for (const [chemin, p] of Object.entries(PAGES)) {
  ecrire(p.fichier || chemin.slice(1), injecter(coquille, pageStatique(chemin, p)));
}
ecrire('404', injecter(coquille, PAGE_404));

let articles;
let projets;
try {
  [articles, projets] = await Promise.all([
    pbTous('articles', { filter: '(published = true)', sort: '-created', fields: 'id,slug,title,excerpt,content,category,tags,reading_time,created,updated' }),
    pbTous('projects', { sort: '-created', fields: 'id,slug,name,resume,imageUrls' }),
  ]);
} catch (e) {
  console.error(`✗ PocketBase injoignable (${e.message}) : pages des articles et des projets non générées, build en échec`);
  process.exit(1);
}

const SLUG_ARTICLE = /^[a-z0-9][a-z0-9-]{1,118}$/;
const SLUG_PROJET = /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/;
const articlesOk = articles.filter((a) => SLUG_ARTICLE.test(String(a.slug)));
for (const a of articlesOk) ecrire(`blog/${a.slug}`, injecter(coquille, pageArticle(a)));
const projetsOk = projets.filter((p) => SLUG_PROJET.test(String(p.slug)));
for (const p of projetsOk) ecrire(`Projet/${p.slug}`, injecter(coquille, pageProjet(p)));
const ignores = [...articles.filter((a) => !SLUG_ARTICLE.test(String(a.slug))), ...projets.filter((p) => !SLUG_PROJET.test(String(p.slug)))].map((r) => r.slug);

// Sitemap du blog, sur le domaine (robots.txt le déclare ; celui de chatbot-api reste la version à jour entre deux déploiements)
const jour = (a) => dateIso(a.updated || a.created).slice(0, 10);
const urls = [
  `  <url>\n    <loc>${SITE}/blog</loc>\n${articlesOk[0] ? `    <lastmod>${jour(articlesOk[0])}</lastmod>\n` : ''}    <changefreq>weekly</changefreq>\n  </url>`,
  ...articlesOk.map((a) => `  <url>\n    <loc>${SITE}/blog/${a.slug}</loc>\n    <lastmod>${jour(a)}</lastmod>\n  </url>`),
];
fs.writeFileSync(path.join(BUILD, 'sitemap-blog.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);

console.log(`✓ pré-rendu SEO : ${Object.keys(PAGES).length + 1} pages, ${articlesOk.length} articles, ${projetsOk.length} projets dans build/pages/, sitemap-blog.xml (${articlesOk.length} URL)` + (ignores.length ? ` — slugs ignorés (caractères hors URL) : ${ignores.join(', ')}` : ''));
