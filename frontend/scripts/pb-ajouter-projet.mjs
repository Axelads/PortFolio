// Ajoute (ou met à jour) une fiche de la collection `projects` du portfolio
// sur PocketBase, avec ses visuels hébergés dans le champ fichier `images`.
//
// Usage (depuis frontend/) :
//   node scripts/pb-ajouter-projet.mjs scripts/fiches/honneure.json <dossier des images>
//
// La fiche JSON contient les champs de la collection (slug, name, date, completed,
// category, resume, githubUrl, liveUrl, skillsUsed, objectives) et `images` :
// la liste ordonnée des fichiers du dossier (WebP ≤ 1200 px, voir
// scripts/pb-card-images/). Idempotent par slug :
//   - fiche absente : POST multipart (champs + images), puis PATCH imageUrls
//     avec les URL /api/files/... renvoyées (ordre conservé) ;
//   - fiche présente : PATCH des champs texte ; les images ne sont ajoutées
//     que si la fiche n'en a encore aucune (sinon rien n'est touché).
// Identifiants superuser : PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD dans frontend/.env.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const racine = fileURLToPath(new URL("..", import.meta.url));
dotenv.config({ path: path.join(racine, ".env") });

const PB = (process.env.REACT_APP_POCKETBASE_URL || "").replace(/\/$/, "");
const [ficheArg, dossierArg] = process.argv.slice(2);
if (!PB || !ficheArg || !dossierArg) {
  console.error("Usage : node scripts/pb-ajouter-projet.mjs <fiche.json> <dossier images> (REACT_APP_POCKETBASE_URL requis)");
  process.exit(1);
}

const fiche = JSON.parse(fs.readFileSync(path.resolve(ficheArg), "utf8"));
const dossier = path.resolve(dossierArg);
const { images = [], ...champs } = fiche;
const TYPES = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml" };

for (const f of images) {
  if (!fs.existsSync(path.join(dossier, f))) {
    console.error("Image introuvable :", path.join(dossier, f));
    process.exit(1);
  }
}

// Superuser avec double authentification (MFA) : le mot de passe renvoie un
// `mfaId`, il faut ensuite un code à usage unique reçu par e-mail. Premier
// passage sans PB_OTP : le code est demandé et les identifiants affichés ;
// second passage avec PB_OTP=<code> PB_OTP_ID=<otpId> PB_MFA_ID=<mfaId>.
const SUPER = `${PB}/api/collections/_superusers`;
const json = (corps) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
let token = null;
const auth = await fetch(`${SUPER}/auth-with-password`, json({ identity: process.env.PB_ADMIN_EMAIL, password: process.env.PB_ADMIN_PASSWORD }));
const reponse = await auth.json().catch(() => ({}));
if (auth.ok) {
  token = reponse.token;
} else if (auth.status === 401 && reponse.mfaId) {
  if (!process.env.PB_OTP) {
    const otp = await fetch(`${SUPER}/request-otp`, json({ email: process.env.PB_ADMIN_EMAIL }));
    const { otpId } = await otp.json();
    console.log("Double authentification : code envoyé par e-mail. Relancer avec");
    console.log(`  PB_OTP=<code> PB_OTP_ID=${otpId} PB_MFA_ID=${reponse.mfaId}`);
    process.exit(2);
  }
  const auth2 = await fetch(`${SUPER}/auth-with-otp`, json({ otpId: process.env.PB_OTP_ID, password: process.env.PB_OTP, mfaId: process.env.PB_MFA_ID }));
  if (!auth2.ok) {
    console.error("Code refusé", auth2.status, await auth2.text());
    process.exit(1);
  }
  token = (await auth2.json()).token;
} else {
  console.error("Authentification refusée", auth.status, JSON.stringify(reponse));
  process.exit(1);
}
const H = { Authorization: token };

const existant = await (await fetch(
  `${PB}/api/collections/projects/records?filter=${encodeURIComponent(`(slug='${champs.slug}')`)}`,
  { headers: H }
)).json();
let fiche_pb = existant.items?.[0] || null;

const formulaireImages = (fd) => {
  for (const f of images) {
    const type = TYPES[path.extname(f).toLowerCase()] || "application/octet-stream";
    fd.append("images", new Blob([fs.readFileSync(path.join(dossier, f))], { type }), f);
  }
};

if (!fiche_pb) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(champs)) {
    fd.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
  }
  formulaireImages(fd);
  const creation = await fetch(`${PB}/api/collections/projects/records`, { method: "POST", headers: H, body: fd });
  if (!creation.ok) {
    console.error("Création refusée", creation.status, await creation.text());
    process.exit(1);
  }
  fiche_pb = await creation.json();
  console.log("Fiche créée", fiche_pb.id, fiche_pb.slug);
} else {
  const maj = await fetch(`${PB}/api/collections/projects/records/${fiche_pb.id}`, {
    method: "PATCH",
    headers: { ...H, "Content-Type": "application/json" },
    body: JSON.stringify(champs),
  });
  if (!maj.ok) {
    console.error("Mise à jour refusée", maj.status, await maj.text());
    process.exit(1);
  }
  fiche_pb = await maj.json();
  console.log("Fiche mise à jour", fiche_pb.id, fiche_pb.slug);
  if (images.length && !(fiche_pb.images || []).length) {
    const fd = new FormData();
    formulaireImages(fd);
    const envoi = await fetch(`${PB}/api/collections/projects/records/${fiche_pb.id}`, { method: "PATCH", headers: H, body: fd });
    if (!envoi.ok) {
      console.error("Envoi des images refusé", envoi.status, await envoi.text());
      process.exit(1);
    }
    fiche_pb = await envoi.json();
    console.log("Images envoyées", fiche_pb.images.length);
  } else if (images.length) {
    console.log("Images déjà présentes, non touchées :", fiche_pb.images.length);
  }
}

if (images.length && (fiche_pb.images || []).length) {
  const imageUrls = fiche_pb.images.map((nom) => `${PB}/api/files/projects/${fiche_pb.id}/${nom}`);
  const liens = await fetch(`${PB}/api/collections/projects/records/${fiche_pb.id}`, {
    method: "PATCH",
    headers: { ...H, "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrls }),
  });
  if (!liens.ok) {
    console.error("imageUrls refusé", liens.status, await liens.text());
    process.exit(1);
  }
  for (const url of imageUrls) {
    const r = await fetch(url, { method: "HEAD" });
    console.log(r.ok ? "OK " : "?? ", r.status, r.headers.get("content-length"), "octets", path.basename(url));
  }
}

console.log(`Fiche publique : https://axelgregoire.fr/Projet/${fiche_pb.slug}`);
