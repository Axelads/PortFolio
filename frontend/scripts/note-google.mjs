// Avant chaque build : relève la note de la fiche Google auprès de l'API (GET /avis-google) et l'écrit dans
// src/assets/Data/DataNoteGoogle.json. Le portrait de l'accueil affiche ainsi la note dès le premier rendu, sans
// attendre le réseau ni décaler la page ; le navigateur la rafraîchit ensuite auprès de l'API.
// L'API ne lit Google qu'une fois par 24 h : un build n'ajoute aucun appel facturé.
// API injoignable ou réponse douteuse : le fichier existant est gardé et le build continue.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const API = process.env.REACT_APP_API_TABLEAU_DE_BORD || 'https://api.axelgregoire.fr';
const FICHIER = fileURLToPath(new URL('../src/assets/Data/DataNoteGoogle.json', import.meta.url));

/** Garde seulement ce que le portrait affiche, et seulement des valeurs plausibles. */
function nettoyer(avis) {
  if (!avis || avis.branche !== true || !Number.isInteger(avis.nombre) || avis.nombre < 0) return null;
  const note = typeof avis.note === 'number' && avis.note >= 1 && avis.note <= 5 ? avis.note : null;
  const lien = typeof avis.lien === 'string' && avis.lien.startsWith('https://search.google.com/local/reviews?') ? avis.lien : null;
  const releveLe = typeof avis.releveLe === 'string' && !Number.isNaN(Date.parse(avis.releveLe)) ? avis.releveLe : null;
  return { note, nombre: avis.nombre, lien, releveLe };
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
  console.log(`note Google : ${avis.nombre} avis${avis.note ? `, ${String(avis.note).replace('.', ',')}/5` : ''}`);
}

principal();
