// Rendu image par image : node scripts/rendre.mjs [--fps=60] [--workers=4] [--de=0] [--a=86] [--sortie=out/video-muette.mp4]
// Chaque worker pilote son propre Chromium, pose window.__seek(t) puis capture ; les images partent
// directement dans un ffmpeg (aucune image sur disque). Les segments sont ensuite concaténés sans réencodage.
import puppeteer from 'puppeteer';
import { spawn, execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { demarrerServeur } from './serveur.mjs';

const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const FPS = +(opt.fps || 60);
const WORKERS = +(opt.workers || 4);
const sortie = opt.sortie || 'out/video-muette.mp4';
const { serveur, url } = await demarrerServeur();

async function ouvrir() {
  const nav = await puppeteer.launch({ headless: true, args: ['--force-color-profile=srgb', '--disable-gpu-vsync'] });
  const page = await nav.newPage();
  page.on('pageerror', (e) => console.error('[erreur page]', e.message));
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.__pret === true', { timeout: 60000 });
  return { nav, page };
}

// repères sonores + durée
const sonde = await ouvrir();
const { duree, reperes } = await sonde.page.evaluate(() => ({ duree: window.__duree, reperes: window.__reperes }));
await sonde.nav.close();
mkdirSync('out', { recursive: true });
writeFileSync('out/reperes.json', JSON.stringify({ duree, fps: FPS, reperes }, null, 1));
console.log(`${reperes.length} repères sonores → out/reperes.json`);

const de = +(opt.de || 0), a = +(opt.a || duree);
const total = Math.round((a - de) * FPS);
const tranche = Math.ceil(total / WORKERS);
rmSync('out/segments', { recursive: true, force: true });
mkdirSync('out/segments', { recursive: true });
const debut = Date.now();
let faites = 0;

async function worker(k) {
  const i0 = k * tranche, i1 = Math.min(total, i0 + tranche);
  if (i0 >= i1) return null;
  const fichier = `out/segments/seg${k}.mp4`;
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-vf', 'scale=in_range=pc:out_range=tv', '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    '-r', String(FPS), fichier], { stdio: ['pipe', 'inherit', 'inherit'] });
  const fin = new Promise((ok, ko) => ff.on('close', (c) => (c === 0 ? ok() : ko(new Error(`ffmpeg ${c}`)))));
  const { nav, page } = await ouvrir();
  for (let i = i0; i < i1; i++) {
    const t = de + i / FPS;
    await page.evaluate((t) => window.__seek(t), t);
    const img = await page.screenshot({ type: 'jpeg', quality: 96, optimizeForSpeed: true });
    if (!ff.stdin.write(img)) await new Promise((r) => ff.stdin.once('drain', r));
    faites++;
    if (faites % 300 === 0) {
      const s = (Date.now() - debut) / 1000;
      console.log(`${faites}/${total} images — ${s.toFixed(0)} s écoulées, reste ≈ ${((s / faites) * (total - faites)).toFixed(0)} s`);
    }
  }
  ff.stdin.end();
  await fin;
  await nav.close();
  return fichier;
}

const segments = (await Promise.all(Array.from({ length: WORKERS }, (_, k) => worker(k)))).filter(Boolean);
writeFileSync('out/segments/liste.txt', segments.map((f) => `file '${f.replace('out/segments/', '')}'`).join('\n'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'out/segments/liste.txt', '-c', 'copy', sortie]);
serveur.close();
console.log(`${sortie} — ${total} images en ${((Date.now() - debut) / 1000).toFixed(0)} s`);
