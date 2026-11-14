// Planche contact : node scripts/apercu.mjs 0.5 2 4.6 ... [--sortie=out/planche.jpg] [--cols=4]
import puppeteer from 'puppeteer';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { demarrerServeur } from './serveur.mjs';

const args = process.argv.slice(2);
const opt = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const temps = args.filter((a) => !a.startsWith('--')).map(Number);
const sortie = opt.sortie || 'out/planche.jpg';
const cols = +(opt.cols || 4);

const { serveur, url } = await demarrerServeur();
const nav = await puppeteer.launch({ headless: true, args: ['--force-color-profile=srgb'] });
const page = await nav.newPage();
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console.log('[page]', m.text()); });
page.on('pageerror', (e) => console.log('[erreur page]', e.message));
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.__pret === true', { timeout: 30000 });
const dossier = 'out/apercu-tmp';
rmSync(dossier, { recursive: true, force: true });
mkdirSync(dossier, { recursive: true });
const fichiers = [];
for (const [k, t] of temps.entries()) {
  await page.evaluate((t) => window.__seek(t), t);
  const f = `${dossier}/${String(k).padStart(3, '0')}.jpg`;
  await page.screenshot({ path: f, type: 'jpeg', quality: 88 });
  fichiers.push(f);
}
await nav.close();
serveur.close();
if (opt.seul) { console.log(fichiers.join('\n')); process.exit(0); }
// assemblage ffmpeg : vignettes 640×360 avec l'horodatage
const rangs = Math.ceil(fichiers.length / cols);
const entrees = fichiers.flatMap((f) => ['-i', f]);
const filtres = fichiers.map((_, k) => `[${k}:v]scale=640:360,drawtext=fontfile=out/consola.ttf:text='${temps[k].toFixed(2)}s':x=10:y=10:fontsize=26:fontcolor=white:box=1:boxcolor=black@0.6[v${k}]`);
const vides = cols * rangs - fichiers.length;
for (let k = 0; k < vides; k++) filtres.push(`color=black:s=640x360:d=1[n${k}]`);
const etiquettes = [...fichiers.map((_, k) => `[v${k}]`), ...Array.from({ length: vides }, (_, k) => `[n${k}]`)];
const disposition = etiquettes.map((_, k) => `${(k % cols) * 640}_${Math.floor(k / cols) * 360}`).join('|');
filtres.push(`${etiquettes.join('')}xstack=inputs=${etiquettes.length}:layout=${disposition}[out]`);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...entrees, '-filter_complex', filtres.join(';'), '-map', '[out]', '-frames:v', '1', '-q:v', '3', sortie]);
console.log(sortie);
