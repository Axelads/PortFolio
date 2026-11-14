#!/usr/bin/env node
// Rend les images de partage 1200×630 (Open Graph / Twitter) dans public/images/partage/ :
//   - axel-gregoire-1200x630.png : le site (portrait, nom, métier, pile)
//   - blog-<catégorie>-1200x630.png : une par catégorie du blog, dégradé et glyphe de .article-cover (pages/_blog.scss)
// Gabarits HTML dans scripts/images-partage/, capturés par Chrome headless (puppeteer, déjà en devDependency).
//   node scripts/generer-images-partage.mjs
// À relancer quand la direction artistique, le portrait ou les catégories changent ; les PNG sont versionnés.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GABARITS = path.join(RACINE, 'scripts', 'images-partage');
const SORTIE = path.join(RACINE, 'public', 'images', 'partage');

// Même palette que .article-cover--<catégorie> dans src/styles/pages/_blog.scss et GLYPHS de ArticleCover.js
const CATEGORIES = {
  ia: { label: 'IA', glyph: 'IA', gradient: 'linear-gradient(135deg, #00334d, #8bc7b1)' },
  javascript: { label: 'JavaScript', glyph: 'JS', gradient: 'linear-gradient(135deg, #8a6d00, #e8c84a)' },
  react: { label: 'React', glyph: '⚛', gradient: 'linear-gradient(135deg, #0b4f6c, #4a90e2)' },
  css: { label: 'CSS', glyph: '{ }', gradient: 'linear-gradient(135deg, #4b3079, #4a90e2)' },
  outils: { label: 'Outils', glyph: '>_', gradient: 'linear-gradient(135deg, #2f4f4f, #8bc7b1)' },
};

fs.mkdirSync(SORTIE, { recursive: true });
const navigateur = await puppeteer.launch({ headless: true });
try {
  const page = await navigateur.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });

  const capturer = async (html, fichier) => {
    // Le HTML est servi depuis le dossier des gabarits : les chemins relatifs vers public/ et src/ restent valides
    const tmp = path.join(GABARITS, `.rendu-${path.basename(fichier, '.png')}.html`);
    fs.writeFileSync(tmp, html);
    try {
      await page.goto(`file://${tmp.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(SORTIE, fichier), type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
    } finally {
      fs.rmSync(tmp, { force: true });
    }
    console.log(`✓ ${fichier} (${Math.round(fs.statSync(path.join(SORTIE, fichier)).size / 1024)} Ko)`);
  };

  await capturer(fs.readFileSync(path.join(GABARITS, 'site.html'), 'utf8'), 'axel-gregoire-1200x630.png');
  const gabaritBlog = fs.readFileSync(path.join(GABARITS, 'blog.html'), 'utf8');
  for (const [id, c] of Object.entries(CATEGORIES)) {
    const html = gabaritBlog.replaceAll('{{LABEL}}', c.label).replaceAll('{{GLYPH}}', c.glyph).replaceAll('{{GRADIENT}}', c.gradient);
    await capturer(html, `blog-${id}-1200x630.png`);
  }
} finally {
  await navigateur.close();
}
