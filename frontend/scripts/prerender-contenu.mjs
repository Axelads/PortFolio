#!/usr/bin/env node
// Lancé après prerender-seo.mjs (script « postbuild »).
//
// Pourquoi : prerender-seo.mjs ne pose dans build/pages/*.html que les balises <head>, un H1 et un chapeau. Tout le
// reste — textes, projets, clients, articles, liens — n'existait qu'en JavaScript : invisible pour les robots qui ne
// l'exécutent pas (Bing en partie, ChatGPT, Perplexity, Claude, Common Crawl). Constat de l'audit SEO de Saveurs du
// Marché du 14/11/2026 : le lien du portfolio vers la boutique ne comptait pour aucun moteur.
//
// Ce que fait le script : il sert build/ comme o2switch (scripts/servir-build.mjs), ouvre chaque page pré-rendue dans
// Chrome (puppeteer), laisse React la construire, fait défiler la page pour déclencher les sections chargées au
// défilement, puis remplace le bloc .ssr par une copie SÉMANTIQUE de la page rendue : titres, paragraphes, listes,
// tableaux et TOUS les liens (<a href>), sans classes, styles, scripts, images, vidéos ni formulaires.
//
// Côté visiteur, rien ne change : React vide #root au montage et App.js retire les [data-ssr]. Le bloc s'affiche
// quelques dizaines de millisecondes (sous le splash sur l'accueil), comme le H1 avant lui.
//
// Mesure d'audience, images, vidéos et polices sont bloquées pendant la capture (aucune fausse visite comptée).
// Une page qui ne se rend pas fait échouer le build : déployer sans ce contenu serait une régression silencieuse.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = path.join(RACINE, process.env.BUILD_PATH || 'build');
const PAGES_DIR = path.join(BUILD, 'pages');
const PORT = 8097;
const ORIGINE = `http://localhost:${PORT}`;
const EN_PARALLELE = 3;
const MOTS_MINIMUM = 30;

// ─────────────────────────────── pages à capturer ───────────────────────────────
function lister(dossier) {
  return fs.readdirSync(dossier, { withFileTypes: true }).flatMap((e) => {
    const chemin = path.join(dossier, e.name);
    return e.isDirectory() ? lister(chemin) : e.name.endsWith('.html') ? [chemin] : [];
  });
}
const fichiers = lister(PAGES_DIR).filter((f) => path.basename(f) !== '404.html');
const routeDe = (fichier) => {
  const relatif = path.relative(PAGES_DIR, fichier).replace(/\\/g, '/').replace(/\.html$/, '');
  return relatif === 'accueil' ? '/' : `/${relatif}`;
};

// ─────────────────────────────── serveur local (règles d'o2switch) ───────────────────────────────
function demarrerServeur() {
  return new Promise((resoudre, rejeter) => {
    const serveur = spawn(process.execPath, [path.join(RACINE, 'scripts', 'servir-build.mjs'), String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
    const delai = setTimeout(() => rejeter(new Error('servir-build.mjs ne répond pas')), 15000);
    serveur.stdout.on('data', (d) => {
      if (String(d).includes('servi comme o2switch')) {
        clearTimeout(delai);
        resoudre(serveur);
      }
    });
    serveur.on('exit', (code) => rejeter(new Error(`servir-build.mjs arrêté (code ${code})`)));
  });
}

// ─────────────────────────────── copie sémantique (exécutée dans la page) ───────────────────────────────
function copieSemantique() {
  const GARDER = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'A', 'UL', 'OL', 'LI', 'STRONG', 'EM', 'B', 'I', 'BLOCKQUOTE', 'FIGCAPTION', 'TIME', 'ADDRESS', 'NAV', 'HEADER', 'FOOTER', 'MAIN', 'SECTION', 'ARTICLE', 'ASIDE', 'DL', 'DT', 'DD', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'CODE', 'PRE', 'BR']);
  const JETER = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'CANVAS', 'VIDEO', 'AUDIO', 'IFRAME', 'OBJECT', 'EMBED', 'IMG', 'PICTURE', 'SOURCE', 'INPUT', 'SELECT', 'TEXTAREA', 'DIALOG', 'BUTTON', 'LABEL', 'FORM']);
  const EXCLURE = '.chatbot, #splash-static, .ssr, [role="dialog"]';
  const BLOC = /^(block|flex|grid|list-item|table|table-row|table-cell|flow-root)$/;
  const echapper = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const attribut = (s) => echapper(s).replace(/"/g, '&quot;');
  let liens = 0;

  function rendre(noeud) {
    if (noeud.nodeType === Node.TEXT_NODE) return echapper(noeud.nodeValue);
    if (noeud.nodeType !== Node.ELEMENT_NODE) return '';
    const el = noeud;
    const balise = el.tagName;
    if (JETER.has(balise) || el.matches(EXCLURE)) return '';
    if (el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true') return '';
    const style = getComputedStyle(el);
    if (style.display === 'none') return '';
    const interieur = [...el.childNodes].map(rendre).join('');

    if (!GARDER.has(balise)) return BLOC.test(style.display) ? ` ${interieur} ` : interieur;
    const tag = balise.toLowerCase();
    if (tag === 'br') return '<br>';

    if (tag === 'a') {
      const href = el.getAttribute('href') || '';
      if (!href || /^javascript:/i.test(href)) return interieur;
      let texte = interieur.trim();
      if (!texte.replace(/<[^>]*>/g, '').trim()) {
        // Lien icône (GitHub, LinkedIn…) ou logo : son nom accessible sert de texte
        texte = echapper(el.getAttribute('aria-label') || el.getAttribute('title') || el.querySelector('img[alt]')?.getAttribute('alt') || '');
      }
      if (!texte) return '';
      const rel = (el.getAttribute('rel') || '').split(/\s+/).filter((r) => /^(nofollow|sponsored|ugc)$/.test(r)).join(' ');
      liens += 1;
      return `<a href="${attribut(href)}"${rel ? ` rel="${rel}"` : ''}>${texte}</a>`;
    }

    if (!interieur.replace(/<[^>]*>/g, '').trim()) return '';
    let attributs = '';
    if (tag === 'time' && el.getAttribute('datetime')) attributs = ` datetime="${attribut(el.getAttribute('datetime'))}"`;
    if ((tag === 'td' || tag === 'th') && el.getAttribute('colspan')) attributs = ` colspan="${attribut(el.getAttribute('colspan'))}"`;
    return `<${tag}${attributs}>${interieur}</${tag}>`;
  }

  const racine = document.getElementById('root');
  const html = [...racine.childNodes].map(rendre).join('').replace(/\s+/g, ' ').replace(/> </g, '><').trim();
  const texte = racine.innerText || '';
  return { html, liens, mots: texte.split(/\s+/).filter(Boolean).length, h1: (html.match(/<h1[\s>]/g) || []).length };
}

// ─────────────────────────────── capture d'une page ───────────────────────────────
async function capturer(navigateur, route) {
  const page = await navigateur.newPage();
  try {
    await page.setViewport({ width: 1280, height: 900 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.setRequestInterception(true);
    page.on('request', (requete) => {
      const type = requete.resourceType();
      if (['image', 'media', 'font', 'ping'].includes(type) || /\/mesure(\?|$)/.test(requete.url())) requete.abort();
      else requete.continue();
    });
    await page.goto(`${ORIGINE}${route}`, { waitUntil: 'networkidle0', timeout: 45000 });
    // React monté : le bloc .ssr a été remplacé et <main> existe
    await page.waitForFunction(() => !document.querySelector('#root > .ssr') && document.querySelector('#root main'), { timeout: 20000 });
    // Défilement jusqu'en bas : sections et listes chargées à l'apparition (IntersectionObserver)
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForNetworkIdle({ idleTime: 600, timeout: 15000 }).catch(() => {});
    return await page.evaluate(copieSemantique);
  } finally {
    await page.close();
  }
}

// ─────────────────────────────── injection ───────────────────────────────
const BLOC_SSR = /<div id="root"><div class="(ssr[^"]*)" data-ssr>([\s\S]*?)<\/div><\/div>/;

function injecter(fichier, copie) {
  const html = fs.readFileSync(fichier, 'utf8');
  const trouve = html.match(BLOC_SSR);
  if (!trouve) throw new Error(`bloc .ssr introuvable dans ${path.relative(BUILD, fichier)}`);
  // Sans H1 dans la page rendue, on garde le H1 et le chapeau d'origine en tête
  const contenu = copie.h1 ? copie.html : `${trouve[2]}${copie.html}`;
  fs.writeFileSync(fichier, html.replace(BLOC_SSR, `<div id="root"><div class="${trouve[1]}" data-ssr>${contenu}</div></div>`));
}

// ─────────────────────────────── exécution ───────────────────────────────
const debut = Date.now();
const serveur = await demarrerServeur();
const navigateur = await puppeteer.launch({ headless: true });
const echecs = [];
const bilan = [];
try {
  const file = fichiers.map((f) => ({ fichier: f, route: routeDe(f) }));
  const ouvrier = async () => {
    while (file.length) {
      const { fichier, route } = file.shift();
      try {
        const copie = await capturer(navigateur, route);
        if (copie.mots < MOTS_MINIMUM) throw new Error(`page presque vide (${copie.mots} mots)`);
        injecter(fichier, copie);
        bilan.push(`${route} : ${copie.liens} liens, ${copie.mots} mots${copie.h1 === 1 ? '' : `, ${copie.h1} H1`}`);
      } catch (e) {
        echecs.push(`${route} : ${e.message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: EN_PARALLELE }, ouvrier));
} finally {
  await navigateur.close();
  serveur.kill();
}

if (echecs.length) {
  console.error(`✗ pré-rendu du contenu : ${echecs.length} page(s) en échec\n  ${echecs.join('\n  ')}`);
  process.exit(1);
}
console.log(`✓ pré-rendu du contenu : ${bilan.length} pages en ${Math.round((Date.now() - debut) / 1000)} s`);
if (process.env.PRERENDU_DETAIL) console.log(`  ${bilan.sort().join('\n  ')}`);
