import React from 'react';
import { CHEMINS } from '../constantes';
import { formaterNombre, joursContinus } from '../outils';
import { LogoProjet } from './CarteProjet';
import Courbe from './Courbe';

const compter = (n, un, plusieurs = `${un}s`) => `${formaterNombre(n)} ${n > 1 ? plusieurs : un}`;

/**
 * Audience de chaque projet mesuré sur ses 30 derniers jours, du plus fréquenté au moins fréquenté.
 *  - Site : ses visiteurs par jour, lus par le module de son PocketBase (ou de celui qui l'héberge), sinon dans les
 *    journaux de son hébergeur.
 *  - Application : premiers téléchargements App Store et installations Google Play, additionnés jour par jour.
 * Un projet peut avoir les deux lignes (Lunello : l'app et son site). Aucune ligne pour une source non branchée.
 */
export function lignesAudience(projets, { pocketbase, sites, ios, android }) {
  const lignes = [];
  for (const projet of projets) {
    const trafic = pocketbase?.projets?.[projet.slug]?.trafic;
    const journaux = sites?.projets?.[projet.slug];
    if (trafic?.jours?.length) {
      lignes.push({
        cle: `${projet.slug}-site`,
        projet,
        mesure: 'Visiteurs du site',
        unite: ['visiteur', 'visiteurs'],
        total: trafic.total.visiteurs,
        points: joursContinus(trafic.jours).map((j) => ({ jour: j.jour, valeur: j.visiteurs, detail: compter(j.vues, 'page vue', 'pages vues') })),
      });
    } else if (journaux?.joursLus) {
      lignes.push({
        cle: `${projet.slug}-site`,
        projet,
        mesure: 'Visiteurs du site',
        unite: ['visiteur', 'visiteurs'],
        total: journaux.total.visiteurs,
        points: journaux.jours.map((j) => ({ jour: j.jour, valeur: j.visiteurs, absent: j.absent, detail: j.absent ? null : compter(j.pagesVues, 'page vue', 'pages vues') })),
      });
    }

    const parJour = new Map();
    const ajouter = (jour, cle, n) => parJour.set(jour, { ...(parJour.get(jour) || { ios: 0, android: 0 }), [cle]: n });
    for (const j of ios?.projets?.[projet.slug]?.ventes?.jours || []) if (!j.illisible) ajouter(j.date, 'ios', j.telechargements);
    for (const j of android?.projets?.[projet.slug]?.installations?.jours || []) ajouter(j.date, 'android', j.installations);
    // Les deux stores ne publient pas les mêmes jours : on garde les 30 derniers de leur réunion.
    const jours = [...parJour].sort(([a], [b]) => a.localeCompare(b)).slice(-30);
    const total = jours.reduce((s, [, j]) => s + j.ios + j.android, 0);
    // Une application sans aucun téléchargement n'encombre la comparaison que si elle est en production.
    if (jours.length > 1 && (total > 0 || projet.statut === 'production')) {
      lignes.push({
        cle: `${projet.slug}-app`,
        projet,
        mesure: 'Téléchargements de l’app',
        unite: ['téléchargement', 'téléchargements'],
        total,
        points: jours.map(([jour, j]) => ({ jour, valeur: j.ios + j.android, detail: [j.ios && `App Store ${j.ios}`, j.android && `Google Play ${j.android}`].filter(Boolean).join(' · ') || null })),
      });
    }
  }
  return lignes.sort((a, b) => b.total - a.total);
}

/** Tuiles d'audience : logo, projet, mesure, total de la période et courbe à lire jour par jour. */
const Audience = ({ lignes, onOuvrir }) => (
  <ul className="tdb-audience">
    {lignes.map((l) => (
      <li key={l.cle} className="tdb-audience__ligne">
        <a
          className="tdb-audience__projet"
          href={CHEMINS.fiche(l.projet.slug)}
          onClick={(e) => {
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            onOuvrir(l.projet);
          }}
        >
          <LogoProjet projet={l.projet} taille={32} />
          <span className="tdb-audience__noms">
            <span className="tdb-audience__nom">{l.projet.nom}</span>
            <span className="tdb-audience__mesure">{l.mesure}</span>
          </span>
        </a>
        <p className="tdb-audience__valeur">{formaterNombre(l.total)}</p>
        <Courbe compacte points={l.points} unite={l.unite} libelle={`${l.projet.nom} : ${l.mesure.toLowerCase()} par jour`} />
      </li>
    ))}
  </ul>
);

export default Audience;
