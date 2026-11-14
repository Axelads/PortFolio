// Mesure de fréquentation du site, côté navigateur : une page vue à chaque changement de page et les clics qui
// quittent le site, envoyés à l'API du tableau de bord (POST /mesure), qui les anonymise avant de les écrire
// (empreinte du jour, jamais d'adresse IP ni de navigateur en clair). Aucun cookie, aucun stockage sur l'appareil
// du visiteur. Les chiffres se lisent dans le tableau de bord privé, fiche « Portfolio », panneau Trafic.
//
// Refus respecté : Global Privacy Control et Do Not Track. Jamais mesuré : l'admin du site, le tableau de bord, la
// page de signature, et tout ce qui tourne en local. Mes propres visites sont envoyées marquées « équipe » (admin du
// site connecté, ou interrupteur « ne pas me compter sur cet appareil » du tableau de bord) : comptées à part.
import { URL_API_TABLEAU_DE_BORD } from '../../pages/TableauDeBord/constantes';

/** Drapeau posé par le tableau de bord (même origine que le site) : « ne pas compter mes visites sur cet appareil ». */
export const CLE_EXCLUSION = 'mesure-exclue';
const HORS_MESURE = /^\/(admin|projet-ensemble-protege|signer)(\/|$)/;

export function environnementLocal() {
  const hote = window.location.hostname;
  return hote === 'localhost' || hote === '127.0.0.1' || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hote);
}

export function refusExprime() {
  return navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1';
}

/** Vrai pour mes propres visites : admin du site connecté, ou drapeau d'exclusion posé depuis le tableau de bord. */
export function mesVisites() {
  try {
    return localStorage.getItem(CLE_EXCLUSION) === '1' || Boolean(localStorage.getItem('pb_admin_token'));
  } catch {
    return false;
  }
}

/**
 * Envoie un événement de mesure. `sendBeacon` aboutit même si la page se ferme ou si le lien cliqué quitte le site ;
 * en text/plain, le navigateur n'envoie pas de pré-vol CORS. Jamais d'erreur remontée, jamais bloquant.
 */
export function envoyerMesure(donnees) {
  try {
    if (environnementLocal() || refusExprime() || HORS_MESURE.test(window.location.pathname)) return;
    const corps = JSON.stringify(mesVisites() ? { ...donnees, e: true } : donnees);
    const url = `${URL_API_TABLEAU_DE_BORD}/mesure`;
    if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob([corps], { type: 'text/plain' }))) return;
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: corps, keepalive: true, credentials: 'omit' }).catch(() => {});
  } catch {
    /* la mesure ne casse jamais le site */
  }
}

/** Note une action du visiteur. `action` : sortant | email | telephone | fichier | formulaire | autre. */
export function mesurerAction(action, libelle = '', cible = '') {
  envoyerMesure({ t: 'clic', c: window.location.pathname, a: action, l: String(libelle).slice(0, 120), x: String(cible).slice(0, 300) });
}
