// Lancé automatiquement après `npm run build` (script « postbuild »).
// Calcule la Content-Security-Policy de la page /projet-ensemble-protege et l'écrit dans build/.htaccess.
//
// Le site est statique (o2switch) : pas de nonce possible. On autorise donc les scripts inline de index.html
// par leur empreinte SHA-256, recalculée à chaque build (le runtime de CRA y est inliné et change à chaque fois).
// Le build échoue si le marqueur est introuvable : une page privée ne part jamais sans sa CSP.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// BUILD_PATH et REACT_APP_API_TABLEAU_DE_BORD : mêmes variables que CRA (build de test local).
const build = path.resolve(__dirname, '..', process.env.BUILD_PATH || 'build');
const html = fs.readFileSync(path.join(build, 'index.html'), 'utf8');
const fichierHtaccess = path.join(build, '.htaccess');
const MARQUEUR = '__CSP_TABLEAU_DE_BORD__';
const API = process.env.REACT_APP_API_TABLEAU_DE_BORD || 'https://api.axelgregoire.fr';

const empreinte = (texte) => `'sha256-${crypto.createHash('sha256').update(texte, 'utf8').digest('base64')}'`;

// Scripts inline exécutables (les blocs JSON-LD sont des données : la CSP ne les concerne pas).
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(([, attributs]) => !/type=["']?application\/ld\+json/i.test(attributs))
  .map(([, , contenu]) => empreinte(contenu));
// Gestionnaires inline (ex. onload="this.media='all'" du chargement non bloquant des polices). Le minifieur du
// build peut basculer les guillemets (onload='this.media="all"') : on accepte les deux formes, et l'empreinte
// porte sur la valeur exacte telle qu'elle est livrée.
const gestionnaires = [...html.matchAll(/<[a-z][^>]*?\son[a-z]+=(?:"([^"]*)"|'([^']*)')/gi)].map(([, doubles, simples]) => empreinte(doubles ?? simples));

const csp = [
  "default-src 'self'",
  `script-src 'self' ${scripts.join(' ')}${gestionnaires.length ? ` 'unsafe-hashes' ${[...new Set(gestionnaires)].join(' ')}` : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data:",
  `connect-src 'self' ${API}`,
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const htaccess = fs.readFileSync(fichierHtaccess, 'utf8');
if (!htaccess.includes(MARQUEUR)) {
  console.error(`✗ ${MARQUEUR} introuvable dans build/.htaccess : CSP du tableau de bord non posée.`);
  process.exit(1);
}
fs.writeFileSync(fichierHtaccess, htaccess.replace(MARQUEUR, csp));
console.log(`✓ CSP du tableau de bord : ${scripts.length} script(s) et ${new Set(gestionnaires).size} gestionnaire(s) inline autorisés par empreinte`);
