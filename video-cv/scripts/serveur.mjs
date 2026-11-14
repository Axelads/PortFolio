// Serveur statique minimal pour la page de scènes (polices, images, scripts servis en http)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.css': 'text/css', '.wav': 'audio/wav', '.mp4': 'video/mp4' };

export function demarrerServeur(port = 0) {
  const serveur = createServer(async (req, res) => {
    const chemin = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const fichier = normalize(resolve(racine, '.' + (chemin === '/' ? '/index.html' : chemin)));
    if (!fichier.startsWith(racine)) { res.writeHead(403).end(); return; }
    try {
      const corps = await readFile(fichier);
      res.writeHead(200, { 'Content-Type': TYPES[extname(fichier)] || 'application/octet-stream' }).end(corps);
    } catch { res.writeHead(404).end(); }
  });
  return new Promise((ok) => serveur.listen(port, '127.0.0.1', () => ok({ serveur, url: `http://127.0.0.1:${serveur.address().port}/` })));
}
