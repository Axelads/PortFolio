import { useEffect, useState } from 'react';
import instantane from '../../assets/Data/DataNoteGoogle.json';
import { URL_API_TABLEAU_DE_BORD } from '../../pages/TableauDeBord/constantes';

// Note et avis de la fiche Google d'Axel, partagés par le portrait (NoteGoogle) et le carrousel du pied de page.
// - Premier rendu sans réseau : instantané écrit au build (scripts/note-google.mjs) ou dernier relevé gardé par ce
//   navigateur, le plus récent des deux. L'API (qui ne lit Google qu'une fois par 24 h) le met ensuite à jour.
// - Une seule requête par chargement de page, quel que soit le nombre de composants qui l'utilisent.
// - Tout ce qui vient du réseau ou de la mémoire locale est revérifié ici : forme, notes, adresses Google seulement.

export const SEUIL_AVIS = 5; // choix d'Axel : rien n'est affiché avant 5 avis
const CLE_MEMOIRE = 'note-google';

function adresseSure(valeur, hotes) {
  try {
    const url = new URL(valeur);
    return url.protocol === 'https:' && hotes.includes(url.hostname) ? url.href : null;
  } catch {
    return null;
  }
}

function avisValide(a) {
  if (!a || typeof a.auteur !== 'string' || !a.auteur.trim()) return null;
  if (!Number.isInteger(a.note) || a.note < 1 || a.note > 5) return null;
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

/** Relevé gardé seulement s'il a la forme attendue ; null sinon. */
export function valide(releve) {
  if (!releve || !Number.isInteger(releve.nombre) || releve.nombre < 0) return null;
  const note = typeof releve.note === 'number' && releve.note >= 1 && releve.note <= 5 ? releve.note : null;
  const lien = typeof releve.lien === 'string' && releve.lien.startsWith('https://search.google.com/local/reviews?') ? releve.lien : null;
  const avis = Array.isArray(releve.avis) ? releve.avis.map(avisValide).filter(Boolean).slice(0, 5) : [];
  const releveLe = typeof releve.releveLe === 'string' ? releve.releveLe : null;
  return { note, nombre: releve.nombre, lien, avis, releveLe };
}

function lireMemoire() {
  try {
    return valide(JSON.parse(window.localStorage.getItem(CLE_MEMOIRE)));
  } catch {
    return null;
  }
}

function plusRecent(a, b) {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(b.releveLe || 0) > Date.parse(a.releveLe || 0) ? b : a;
}

let lecture = null;
/** Lit /avis-google une seule fois par chargement de page ; garde le relevé frais dans ce navigateur. */
function lireUneFois() {
  if (!lecture) {
    lecture = fetch(`${URL_API_TABLEAU_DE_BORD}/avis-google`, { credentials: 'omit' })
      .then((r) => (r.ok ? r.json() : null))
      .then((reponse) => {
        const frais = reponse?.branche ? valide(reponse) : null;
        if (!frais || !frais.releveLe) return null;
        try {
          window.localStorage.setItem(CLE_MEMOIRE, JSON.stringify(frais));
        } catch {
          // Mémoire locale indisponible (navigation privée…) : l'instantané du build suffit.
        }
        return frais;
      })
      .catch(() => null);
  }
  return lecture;
}

/** Relevé à afficher (note, nombre, lien, avis), rafraîchi une fois auprès de l'API. */
export function useAvisGoogle() {
  const [releve, setReleve] = useState(() => plusRecent(valide(instantane), lireMemoire()));
  useEffect(() => {
    let actif = true;
    lireUneFois().then((frais) => {
      if (actif && frais) setReleve((actuel) => plusRecent(actuel, frais));
    });
    return () => {
      actif = false;
    };
  }, []);
  return releve;
}

/** Vrai quand la fiche a assez d'avis pour être montrée. */
export const assezDAvis = (releve) => Boolean(releve && releve.note && releve.lien && releve.nombre >= SEUIL_AVIS);

export const formaterNote = (note) => note.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const UNITES = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];
/** « il y a 3 jours », « hier »… calculé au moment de l'affichage (le relevé peut dater de 24 h). */
export function ilYa(dateIso, maintenant = Date.now()) {
  const secondes = (Date.parse(dateIso) - maintenant) / 1000;
  const format = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
  for (const [unite, duree] of UNITES) {
    if (Math.abs(secondes) >= duree) return format.format(Math.round(secondes / duree), unite);
  }
  return "à l'instant";
}
