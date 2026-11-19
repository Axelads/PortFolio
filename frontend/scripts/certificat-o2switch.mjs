#!/usr/bin/env node
// Renouvelle le certificat HTTPS d'axelgregoire.fr (et www) chez Let's Encrypt, puis l'installe par l'API cPanel.
//
// Pourquoi ce script : AutoSSL est désactivé sur le compte o2switch (fonction « autossl » absente), donc le
// certificat installé jusqu'au 27/11/2026 ne pouvait pas se renouveler tout seul.
//
// Déroulé : 1. lit la date d'expiration du certificat en ligne et s'arrête s'il reste plus de 30 jours ;
//           2. défi HTTP-01 : dépose le jeton dans public_html/.well-known/acme-challenge/ par l'API cPanel ;
//           3. installe le certificat obtenu (SSL/install_ssl) ; 4. vérifie le certificat servi.
//
//   node scripts/certificat-o2switch.mjs            renouvelle s'il reste moins de 30 jours
//   node scripts/certificat-o2switch.mjs --forcer   renouvelle quoi qu'il arrive
//   node scripts/certificat-o2switch.mjs --essai    serveur de test Let's Encrypt, rien n'est installé
//
// Secrets HORS du dépôt : jeton cPanel dans C:\Users\profe\.o2switch\jeton-cpanel.env,
// clé du compte Let's Encrypt dans C:\Users\profe\.o2switch\acme\compte-letsencrypt.pem (créée au premier passage).

import acme from 'acme-client';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import tls from 'node:tls';

const DOMAINE = 'axelgregoire.fr';
const NOMS = [DOMAINE, `www.${DOMAINE}`];
const SEUIL_JOURS = 30;

const forcer = process.argv.includes('--forcer');
const essai = process.argv.includes('--essai');

// ─────────────────────────────── client cPanel (jeton hors dépôt) ───────────────────────────────
const dossierSecrets = path.join(os.homedir(), '.o2switch');
const env = Object.fromEntries(
  fs.readFileSync(path.join(dossierSecrets, 'jeton-cpanel.env'), 'utf8').split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const base = `https://${env.O2SWITCH_CPANEL_HOTE}:2083`;
const entetes = { Authorization: `cpanel ${env.O2SWITCH_CPANEL_UTILISATEUR}:${env.O2SWITCH_JETON_CPANEL}` };
// Dossier des défis sur le serveur. Le nom du compte cPanel vient du fichier de secrets : le dépôt est public.
const DOSSIER_DEFIS = `/home/${env.O2SWITCH_CPANEL_UTILISATEUR}/public_html/.well-known/acme-challenge`;
async function uapi(module, fonction, parametres = {}, corps) {
  const r = await fetch(`${base}/execute/${module}/${fonction}`, {
    method: 'POST', headers: entetes, body: corps ?? new URLSearchParams(parametres),
  });
  const json = await r.json();
  if (!json.status) throw new Error(`${module}/${fonction} : ${(json.errors || ['échec']).join(' ; ')}`);
  return json.data;
}
async function api2(module, fonction, parametres = {}) {
  const r = await fetch(`${base}/json-api/cpanel?${new URLSearchParams({ cpanel_jsonapi_user: env.O2SWITCH_CPANEL_UTILISATEUR, cpanel_jsonapi_apiversion: '2', cpanel_jsonapi_module: module, cpanel_jsonapi_func: fonction, ...parametres })}`, { headers: entetes });
  const res = (await r.json()).cpanelresult;
  const echec = res?.error || res?.data?.find?.((d) => d.result === 0)?.reason;
  if (!res || echec || res.event?.result !== 1) throw new Error(`${module}::${fonction} : ${echec || 'échec'}`);
  return res.data;
}

// ─────────────────────────────── certificat servi en ce moment ───────────────────────────────
function certificatServi() {
  return new Promise((ok, ko) => {
    const s = tls.connect({ host: DOMAINE, port: 443, servername: DOMAINE, rejectUnauthorized: false }, () => {
      const c = s.getPeerCertificate();
      s.end();
      ok({ emetteur: c.issuer?.O || c.issuer?.CN, fin: new Date(c.valid_to), noms: c.subjectaltname });
    });
    s.setTimeout(15000, () => { s.destroy(); ko(new Error('délai dépassé en lisant le certificat')); });
    s.on('error', ko);
  });
}
const jour = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const joursRestants = (d) => Math.floor((d - Date.now()) / 86_400_000);

const avant = await certificatServi();
console.log(`Certificat en ligne : ${avant.emetteur}, expire le ${jour(avant.fin)} (${joursRestants(avant.fin)} jours)`);
if (!forcer && !essai && joursRestants(avant.fin) > SEUIL_JOURS) {
  console.log(`Plus de ${SEUIL_JOURS} jours : rien à faire.`);
  process.exit(0);
}

// ─────────────────────────────── Let's Encrypt (défi HTTP-01) ───────────────────────────────
const dossierAcme = path.join(dossierSecrets, 'acme');
fs.mkdirSync(dossierAcme, { recursive: true });
const fichierCompte = path.join(dossierAcme, essai ? 'compte-letsencrypt-essai.pem' : 'compte-letsencrypt.pem');
if (!fs.existsSync(fichierCompte)) fs.writeFileSync(fichierCompte, await acme.crypto.createPrivateKey(), { mode: 0o600 });

const client = new acme.Client({
  directoryUrl: essai ? acme.directory.letsencrypt.staging : acme.directory.letsencrypt.production,
  accountKey: fs.readFileSync(fichierCompte),
});

const [cle, csr] = await acme.crypto.createCsr({ commonName: DOMAINE, altNames: NOMS });

const pem = await client.auto({
  csr,
  termsOfServiceAgreed: true,
  challengePriority: ['http-01'],
  async challengeCreateFn(authz, challenge, autorisation) {
    if (challenge.type !== 'http-01') throw new Error(`défi ${challenge.type} non géré`);
    const corps = new FormData();
    corps.append('dir', DOSSIER_DEFIS);
    corps.append('overwrite', '1');
    corps.append('file-1', new Blob([autorisation], { type: 'text/plain' }), challenge.token);
    await uapi('Fileman', 'upload_files', {}, corps);
    console.log(`  défi déposé pour ${authz.identifier.value}`);
  },
  async challengeRemoveFn(authz, challenge) {
    await api2('Fileman', 'fileop', { op: 'unlink', sourcefiles: `${DOSSIER_DEFIS}/${challenge.token}`, doubledecode: '0' }).catch(() => {});
  },
});

const [feuille, ...chaine] = acme.crypto.splitPemChain(pem);
const info = acme.crypto.readCertificateInfo(feuille);
console.log(`✓ Certificat obtenu (${info.issuer.commonName}), valable jusqu'au ${jour(info.notAfter)} pour ${info.domains.altNames.join(', ')}`);

if (essai) {
  console.log('Mode essai : rien n\'est installé.');
  process.exit(0);
}

// ─────────────────────────────── installation dans cPanel ───────────────────────────────
await uapi('SSL', 'install_ssl', { domain: DOMAINE, cert: feuille, key: cle.toString(), cabundle: chaine.join('\n') });
console.log('✓ Installé dans cPanel');

// ─────────────────────────────── vérification ───────────────────────────────
// o2switch ne recharge pas le serveur web à l'instant : on relit le certificat servi toutes les 30 s, 20 min au plus.
for (let essaiLecture = 0; essaiLecture < 40; essaiLecture++) {
  await new Promise((r) => setTimeout(r, 30_000));
  const apres = await certificatServi().catch(() => null);
  if (apres && apres.fin > avant.fin) {
    console.log(`✓ Certificat en ligne : ${apres.emetteur}, expire le ${jour(apres.fin)} (${apres.noms})`);
    process.exit(0);
  }
}
throw new Error('installé dans cPanel, mais le serveur sert encore l\'ancien certificat après 20 min');
