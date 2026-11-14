import { URL_API_TABLEAU_DE_BORD } from '../TableauDeBord/constantes';

/**
 * Client des routes publiques de signature (lien personnel, sans compte ni cookie). L'API n'accepte les POST que
 * depuis l'origine du portfolio : le navigateur l'envoie lui-même, rien à faire ici.
 */
export const URL_API = URL_API_TABLEAU_DE_BORD;

export async function appelerSignature(chemin, { methode = 'GET', corps } = {}) {
  const reponse = await fetch(`${URL_API}${chemin}`, {
    method: methode,
    credentials: 'omit',
    headers: corps ? { 'Content-Type': 'application/json' } : {},
    body: corps ? JSON.stringify(corps) : undefined,
  });
  const json = await reponse.json().catch(() => ({}));
  return { statut: reponse.status, json };
}

/** Télécharge un PDF de l'API en mémoire et renvoie une adresse blob (même origine : lisible dans une iframe). */
export async function chargerPdf(chemin, { avecSession = false } = {}) {
  const reponse = await fetch(`${URL_API}${chemin}`, { credentials: avecSession ? 'include' : 'omit' });
  if (reponse.status !== 200) return null;
  const blob = await reponse.blob();
  return URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
}

/** Déclenche l'enregistrement d'un PDF sur l'appareil. */
export function enregistrerPdf(url, nom) {
  const a = document.createElement('a');
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
