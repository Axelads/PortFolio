import { formaterDateLongue, formaterJourMois } from './outils';

// Période et dates clés des documents du coffre : « contrat de maintenance du … au …, à renouveler dans 23 jours »,
// fin d'une maintenance offerte, échéance de paiement… L'API donne les dates (periode : debut, fin, aEcheance,
// datesCles) ; ce module en tire le texte, l'état, les alertes et les échéances de la vue d'ensemble.

const FUSEAU = 'Europe/Paris';
const JOUR = 86_400_000;
// On prévient deux mois avant le terme d'une période ou une date clé ; au-delà, rien à signaler.
export const HORIZON_JOURS = 60;

// Ce qui se passe à la fin de la période (mêmes valeurs que l'API).
export const A_ECHEANCE = [
  { cle: '', libelle: 'Non précisé' },
  { cle: 'renouveler', libelle: 'À renouveler' },
  { cle: 'tacite', libelle: 'Reconduction tacite' },
  { cle: 'fin', libelle: 'Prend fin' },
];
export const DATES_CLES_MAX = 12;
export const PERIODE_VIDE = { debut: '', fin: '', aEcheance: '', datesCles: [] };

/** Jour courant à Paris, AAAA-MM-JJ. */
export const aujourdhuiParis = (instant = Date.now()) => new Date(instant).toLocaleDateString('sv-SE', { timeZone: FUSEAU });
/** Nombre de jours de `depuis` à `jusqua` (jours AAAA-MM-JJ) ; négatif quand `jusqua` est passé. */
export const joursEntre = (depuis, jusqua) => Math.round((Date.parse(`${jusqua}T12:00:00Z`) - Date.parse(`${depuis}T12:00:00Z`)) / JOUR);
/** « aujourd’hui », « demain », « dans 23 jours ». */
export const dansJours = (n) => (n === 0 ? 'aujourd’hui' : n === 1 ? 'demain' : `dans ${n} jours`);

/** « du 1 novembre 2026 au 31 octobre 2027 », « jusqu’au … », « depuis le … », « à partir du … » ; '' sans période. */
export function decrirePeriode(periode, aujourdhui = aujourdhuiParis()) {
  const { debut, fin } = periode || {};
  if (debut && fin) return `du ${formaterDateLongue(debut)} au ${formaterDateLongue(fin)}`;
  if (fin) return `jusqu’au ${formaterDateLongue(fin)}`;
  if (debut) return `${debut > aujourdhui ? 'à partir du' : 'depuis le'} ${formaterDateLongue(debut)}`;
  return '';
}

/**
 * Où en est la période aujourd'hui : null s'il n'y a rien à dire, sinon { texte, ton, badge, jours }.
 * `badge` n'est donné que s'il y a quelque chose à faire ou à savoir (« À renouveler », « Fin proche »…) ;
 * `ton` suit les badges du tableau de bord (neutre, accent, alerte, panne) ; `jours` = jours avant la fin.
 */
export function etatPeriode(periode, aujourdhui = aujourdhuiParis()) {
  const { debut, fin, aEcheance = '' } = periode || {};
  if (debut && debut > aujourdhui) return { texte: `commence ${dansJours(joursEntre(aujourdhui, debut))}`, ton: 'neutre', badge: null, jours: fin ? joursEntre(aujourdhui, fin) : null };
  if (!fin) return null;
  const jours = joursEntre(aujourdhui, fin);
  const passe = jours < 0;
  const proche = jours <= HORIZON_JOURS;
  const le = formaterDateLongue(fin);
  if (aEcheance === 'tacite') {
    if (passe) return { texte: `reconduit tacitement depuis le ${le}`, ton: 'neutre', badge: null, jours };
    return proche ? { texte: `reconduction tacite ${dansJours(jours)}`, ton: 'accent', badge: 'Reconduction proche', jours } : { texte: 'reconduction tacite à l’échéance', ton: 'neutre', badge: null, jours };
  }
  if (aEcheance === 'fin') {
    if (passe) return { texte: `terminé le ${le}`, ton: 'neutre', badge: 'Terminé', jours };
    return proche ? { texte: `se termine ${dansJours(jours)}`, ton: 'alerte', badge: 'Fin proche', jours } : { texte: 'prend fin à l’échéance', ton: 'neutre', badge: null, jours };
  }
  if (aEcheance === 'renouveler') {
    if (passe) return { texte: `échu depuis le ${le}, à renouveler`, ton: 'panne', badge: 'À renouveler', jours };
    return proche ? { texte: `à renouveler ${dansJours(jours)}`, ton: 'alerte', badge: 'À renouveler', jours } : { texte: 'à renouveler à l’échéance', ton: 'neutre', badge: null, jours };
  }
  if (passe) return { texte: `échu depuis le ${le}`, ton: 'alerte', badge: 'Échu', jours };
  return proche ? { texte: `arrive à échéance ${dansJours(jours)}`, ton: 'alerte', badge: 'Échéance proche', jours } : null;
}

/** Dates clés d'un document avec leur distance à aujourd'hui (négative = passée), dans l'ordre du calendrier. */
export const datesClesDe = (periode, aujourdhui = aujourdhuiParis()) =>
  [...(periode?.datesCles || [])].sort((a, b) => (a.date < b.date ? -1 : 1)).map((d) => ({ ...d, jours: joursEntre(aujourdhui, d.date) }));

const nomDuProjet = (projets, slug) => projets.find((p) => p.slug === slug)?.nom || '';
const enTete = (document, projets) => {
  const projet = nomDuProjet(projets, document.projet);
  return projet ? `${projet} · ${document.titre}` : document.titre;
};

/**
 * Alertes du coffre pour la vue d'ensemble : périodes échues ou proches de leur terme qui demandent un geste
 * (à renouveler, fin proche, échéance non précisée) et dates clés des sept prochains jours. Une reconduction
 * tacite n'alerte pas : elle figure dans les prochaines échéances.
 */
export function alertesDuCoffre(documents, projets, aujourdhui = aujourdhuiParis()) {
  return (documents || []).flatMap((d) => {
    const alertes = [];
    const etat = etatPeriode(d.periode, aujourdhui);
    if (etat?.badge && etat.ton !== 'accent' && !(d.periode.aEcheance === 'fin' && etat.jours < 0)) {
      alertes.push({ gravite: etat.ton === 'panne' ? 'alerte' : etat.jours <= 30 ? 'alerte' : 'info', titre: `${enTete(d, projets)} : ${etat.texte}`, detail: decrirePeriode(d.periode, aujourdhui), temps: formaterJourMois(d.periode.fin) });
    }
    for (const cle of datesClesDe(d.periode, aujourdhui).filter((c) => c.jours >= 0 && c.jours <= 7)) {
      alertes.push({ gravite: 'info', titre: `${enTete(d, projets)} : ${cle.libelle.toLowerCase()} ${dansJours(cle.jours)}`, detail: formaterDateLongue(cle.date), temps: formaterJourMois(cle.date) });
    }
    return alertes;
  });
}

/**
 * Échéances du coffre dans les `horizon` prochains jours (fins de période et dates clés), les plus proches d'abord :
 * [{ cle, date, jours, texte, detail }].
 */
export function echeancesDuCoffre(documents, projets, { horizon = HORIZON_JOURS, aujourdhui = aujourdhuiParis() } = {}) {
  const libelleFin = { renouveler: 'à renouveler', tacite: 'reconduction tacite', fin: 'fin du contrat', '': 'échéance' };
  return (documents || [])
    .flatMap((d) => {
      const lignes = datesClesDe(d.periode, aujourdhui).map((c) => ({ cle: `${d.source}-${d.id}-${c.date}-${c.libelle}`, date: c.date, jours: c.jours, texte: c.libelle, detail: enTete(d, projets) }));
      if (d.periode?.fin) lignes.push({ cle: `${d.source}-${d.id}-fin`, date: d.periode.fin, jours: joursEntre(aujourdhui, d.periode.fin), texte: `${d.titre} : ${libelleFin[d.periode.aEcheance || '']}`, detail: nomDuProjet(projets, d.projet) || 'Sans projet' });
      return lignes;
    })
    .filter((e) => e.jours >= 0 && e.jours <= horizon)
    .sort((a, b) => a.jours - b.jours);
}
