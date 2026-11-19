// Avant chaque build : relève la note et les avis de la fiche Google auprès de l'API (GET /avis-google) et les écrit
// dans src/assets/Data/DataNoteGoogle.json. Le portrait et le carrousel les affichent ainsi dès le premier rendu, sans
// attendre le réseau ni décaler la page ; le navigateur les rafraîchit ensuite auprès de l'API.
// L'API ne lit Google qu'une fois par 24 h : un build n'ajoute aucun appel facturé.
// API injoignable ou réponse douteuse : le fichier existant est gardé et le build continue.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const API = process.env.REACT_APP_API_TABLEAU_DE_BORD || 'https://api.axelgregoire.fr';
const FICHIER = fileURLToPath(new URL('../src/assets/Data/DataNoteGoogle.json', import.meta.url));

function adresseSure(valeur, hotes) {
  try {
    const url = new URL(valeur);
    return url.protocol === 'https:' && hotes.includes(url.hostname) ? url.href : null;
  } catch {
    return null;
  }
}

/** Un avis réduit à ce que le carrousel affiche ; null s'il manque l'essentiel. */
function nettoyerAvis(a) {
  if (!a || typeof a.auteur !== 'string' || !a.auteur.trim() || !Number.isInteger(a.note) || a.note < 1 || a.note > 5) return null;
  if (typeof a.date !== 'string' || Number.isNaN(Date.parse(a.date))) return null;
  return {
    auteur: a.auteur.trim().slice(0, 80),
    note: a.note,
    texte: typeof a.texte === 'string' ? a.texte.trim().slice(0, 1500) : '',
    date: a.date,
    photo: adresseSure(a.photo, ['lh3.googleusercontent.com']),
    profil: adresseSure(a.profil, ['www.google.com', 'maps.google.com']),
  };
}

/** Garde seulement ce que le portrait et le carrousel affichent, et seulement des valeurs plausibles. */
function nettoyer(releve) {
  if (!releve || releve.branche !== true || !Number.isInteger(releve.nombre) || releve.nombre < 0) return null;
  const note = typeof releve.note === 'number' && releve.note >= 1 && releve.note <= 5 ? releve.note : null;
  const lien = typeof releve.lien === 'string' && releve.lien.startsWith('https://search.google.com/local/reviews?') ? releve.lien : null;
  const avis = Array.isArray(releve.avis) ? releve.avis.map(nettoyerAvis).filter(Boolean).slice(0, 5) : [];
  const releveLe = typeof releve.releveLe === 'string' && !Number.isNaN(Date.parse(releve.releveLe)) ? releve.releveLe : null;
  return { note, nombre: releve.nombre, lien, avis, releveLe };
}

async function principal() {
  let avis = null;
  try {
    const r = await fetch(`${API}/avis-google`, { signal: AbortSignal.timeout(15_000) });
    if (r.ok) avis = nettoyer(await r.json());
  } catch {
    // traité plus bas
  }
  if (!avis) {
    console.warn(`note Google : API ${API} injoignable ou non branchée, ${FICHIER} gardé tel quel`);
    return;
  }
  const actuel = await readFile(FICHIER, 'utf8').catch(() => '');
  const nouveau = `${JSON.stringify(avis, null, 2)}\n`;
  if (actuel !== nouveau) await writeFile(FICHIER, nouveau);
  console.log(`note Google : ${avis.nombre} avis${avis.note ? `, ${String(avis.note).replace('.', ',')}/5` : ''}, ${avis.avis.length} texte(s) d'avis`);
}

principal();
