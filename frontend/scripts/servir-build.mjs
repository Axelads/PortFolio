#!/usr/bin/env node
// Sert build/ en local en reproduisant les règles de public/.htaccess (o2switch), pour vérifier le pré-rendu SEO
// et les vrais 404 avant publication. `npx serve -s build` ne convient pas : il redirige /x.html vers /x et renvoie
// la coquille pour toute URL inconnue.
//   npm run build && node scripts/servir-build.mjs [port]
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BUILD = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'build');
const PORT = Number(process.argv[2]) || 8090;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.woff2': 'font/woff2' };
// Routes connues de l'application (bloc 7 de .htaccess)
const ROUTES = [/^\/(About|cv|Avis|carte|blog|admin|admin\/dashboard|404)\/?$/i, /^\/(blog|Projet)\/[^/]+\/?$/i, /^\/projet-ensemble-protege(\/.*)?$/, /^\/signer\/[^/]+\/?$/];

const envoyer = (res, fichier, statut = 200) => {
  res.writeHead(statut, { 'Content-Type': TYPES[path.extname(fichier)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(fichier).pipe(res);
};
const dansBuild = (relatif) => {
  const f = path.resolve(BUILD, `.${relatif}`);
  return f.startsWith(BUILD) ? f : null;
};

http.createServer((req, res) => {
  const chemin = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const journal = (statut, via) => console.log(`${statut} ${chemin} ← ${via}`);
  if (/^\/pages\//i.test(chemin)) { journal(404, 'pages/ jamais adressé directement'); return envoyer(res, path.join(BUILD, 'pages', '404.html'), 404); }
  if (chemin === '/') { journal(200, 'pages/accueil.html'); return envoyer(res, path.join(BUILD, 'pages', 'accueil.html')); }
  const fichier = dansBuild(chemin);
  if (fichier && fs.existsSync(fichier) && fs.statSync(fichier).isFile()) { journal(200, 'fichier réel'); return envoyer(res, fichier); }
  if (/^\/\.well-known\//.test(chemin)) { journal(404, '.well-known'); return envoyer(res, path.join(BUILD, 'pages', '404.html'), 404); }
  const prerendu = dansBuild(`/pages${chemin.replace(/\/$/, '')}.html`);
  if (prerendu && fs.existsSync(prerendu)) { journal(200, `pré-rendu ${path.relative(BUILD, prerendu)}`); return envoyer(res, prerendu); }
  if (ROUTES.some((r) => r.test(chemin))) { journal(200, 'coquille index.html'); return envoyer(res, path.join(BUILD, 'index.html')); }
  journal(404, 'vrai 404');
  return envoyer(res, path.join(BUILD, 'pages', '404.html'), 404);
}).listen(PORT, () => console.log(`build/ servi comme o2switch sur http://localhost:${PORT}`));
