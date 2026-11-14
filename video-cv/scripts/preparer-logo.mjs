// Vectorise l'olivier-circuit (raster 269 × 406 extrait du logo à bulles, agrandi ×6)
// puis vérifie le tracé : rendu navigateur du SVG vs source seuillée, pixelmatch ≤ 1,5 %.
// Lancer : node scripts/preparer-logo.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import potrace from 'potrace';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import puppeteer from 'puppeteer';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(racine, 'assets/arbre-x6.png');
const ECHELLE = 6;
const SEUIL = 128;

const tracer = new potrace.Potrace();
tracer.setParameters({ threshold: SEUIL, turdSize: 40, optTolerance: 0.3, alphaMax: 1, color: '#000' });
await new Promise((ok, ko) => tracer.loadImage(source, (err) => (err ? ko(err) : ok())));

const largeur = tracer._luminanceData.width;
const hauteur = tracer._luminanceData.height;
const d = tracer.getPathTag().match(/ d="([^"]+)"/)[1];
const viewBox = `0 0 ${largeur} ${hauteur}`;

// Vérification : rendu Chromium du tracé, comparé à la source seuillée, même taille
const navigateur = await puppeteer.launch({ headless: true });
const page = await navigateur.newPage();
await page.setViewport({ width: largeur / 2, height: hauteur / 2 });
await page.setContent(`<html><body style="margin:0;background:#fff">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${largeur / 2}" height="${hauteur / 2}" style="display:block">
  <path d="${d}" fill="#000" fill-rule="evenodd"/></svg></body></html>`);
const rendu = PNG.sync.read(await page.screenshot({ type: 'png' }));
await navigateur.close();

const brut = PNG.sync.read(readFileSync(source));
// Réduire la source ×6 → ×3 (moyenne 2×2) puis seuiller comme potrace
const ref = new PNG({ width: largeur / 2, height: hauteur / 2 });
for (let y = 0; y < ref.height; y++) {
  for (let x = 0; x < ref.width; x++) {
    let somme = 0;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) somme += brut.data[((y * 2 + dy) * brut.width + (x * 2 + dx)) * 4];
    const v = somme / 4 < SEUIL ? 0 : 255;
    const i = (y * ref.width + x) * 4;
    ref.data[i] = ref.data[i + 1] = ref.data[i + 2] = v;
    ref.data[i + 3] = 255;
  }
}
const diff = new PNG({ width: ref.width, height: ref.height });
const ecarts = pixelmatch(ref.data, rendu.data, diff.data, ref.width, ref.height, { threshold: 0.5 });
const pourcentage = (ecarts / (ref.width * ref.height)) * 100;
writeFileSync(resolve(racine, 'out/verif-logo-diff.png'), PNG.sync.write(diff));
console.log(`Tracé : ${d.length} caractères, viewBox ${viewBox}`);
console.log(`Écart rendu / source : ${pourcentage.toFixed(3)} % (seuil 1,5 %)`);
if (pourcentage > 1.5) {
  console.error('Écart trop grand : tracé refusé.');
  process.exit(1);
}

// Repères (unités du viewBox, mesurés sur la source ×1 puis ×6)
const ancrages = {
  hautCircuit: 222 * ECHELLE, // haut du boîtier, base du tronc
  basTronc: 228 * ECHELLE,
  olives: [
    { cx: 142 * ECHELLE, cy: 88 * ECHELLE },
    { cx: 69 * ECHELLE, cy: 150 * ECHELLE },
    { cx: 200 * ECHELLE, cy: 150 * ECHELLE },
  ],
};
const json = JSON.stringify({ viewBox, largeur, hauteur, traitsPleins: d, ancrages });
writeFileSync(resolve(racine, 'assets/donnees-logo.json'), json);
// Variante script classique : la page de scènes se charge sans fetch
writeFileSync(resolve(racine, 'assets/donnees-logo.js'), `window.LOGO=${json};\n`);
console.log('assets/donnees-logo.json + .js écrits');
