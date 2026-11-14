import React from 'react';
import { CHEMINS } from '../constantes';
import HublotAurore from './HublotAurore';
import Icone from './Icone';

const THEMES = [
  { cle: 'sombre', libelle: 'Sombre', icone: 'lune' },
  { cle: 'clair', libelle: 'Clair', icone: 'soleil' },
  { cle: 'auto', libelle: 'Auto', icone: 'activite' },
];

/** Sélecteur Sombre / Clair / Auto : l'indicateur glisse en ressort sous le choix courant. */
const SelecteurTheme = ({ preference, onChanger }) => {
  const rang = THEMES.findIndex((t) => t.cle === preference);
  return (
    <div className="tdb-theme" role="radiogroup" aria-label="Thème" style={{ '--rang': rang }}>
      <span className="tdb-theme__indicateur" aria-hidden="true" />
      {THEMES.map((t) => (
        <button key={t.cle} type="button" role="radio" aria-checked={preference === t.cle} className="tdb-theme__choix" onClick={(e) => onChanger(t.cle, e)}>
          {t.libelle}
        </button>
      ))}
    </div>
  );
};

/** Sur téléphone, un seul bouton qui fait tourner les trois thèmes. */
const BoutonTheme = ({ preference, onChanger }) => {
  const rang = THEMES.findIndex((t) => t.cle === preference);
  const suivant = THEMES[(rang + 1) % THEMES.length];
  return (
    <button type="button" className="tdb-icone-bouton tdb-entete__theme-mobile" onClick={(e) => onChanger(suivant.cle, e)} aria-label={`Thème : ${THEMES[rang].libelle}. Passer en ${suivant.libelle}`}>
      <Icone nom={THEMES[rang].icone} taille={18} />
    </button>
  );
};

const lienInterne = (naviguer, chemin) => (e) => {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  naviguer(chemin);
};

/** En-tête (composant Figma « En-tête », plateformes Bureau et Mobile). */
export const EnTete = ({ ecran, preference, onTheme, onDeconnexion, naviguer, occupe, generique = false }) => (
  <header className={`tdb-entete${generique ? ' tdb-entete--generique' : ''}`}>
    <a className="tdb-entete__marque" href={CHEMINS.vue} onClick={lienInterne(naviguer, CHEMINS.vue)}>
      <HublotAurore apparition={generique} delai={350} />
      Tableau de bord
    </a>
    <nav className="tdb-entete__nav" aria-label="Sections">
      {[
        ['vue', 'Vue d’ensemble', CHEMINS.vue],
        ['documents', 'Documents', CHEMINS.documents],
        ['signatures', 'Signatures', CHEMINS.signatures],
        ['securite', 'Sécurité', CHEMINS.securite],
      ].map(([cle, libelle, chemin]) => (
        <a
          key={cle}
          href={chemin}
          onClick={lienInterne(naviguer, chemin)}
          className={`tdb-onglet${ecran === cle ? ' tdb-onglet--actif' : ''}`}
          aria-current={ecran === cle ? 'page' : undefined}
        >
          {libelle}
        </a>
      ))}
    </nav>
    <div className="tdb-entete__actions">
      <SelecteurTheme preference={preference} onChanger={onTheme} />
      <BoutonTheme preference={preference} onChanger={onTheme} />
      <button type="button" className="tdb-bouton tdb-bouton--fantome tdb-entete__sortie" onClick={onDeconnexion} disabled={occupe}>
        <Icone nom="deconnexion" taille={16} />
        <span className="tdb-entete__sortie-libelle">Se déconnecter</span>
      </button>
    </div>
  </header>
);

/** Barre d'onglets du bas, sur téléphone seulement (composant Figma « Barre mobile »). */
export const BarreMobile = ({ ecran, naviguer, onAlertes }) => (
  <nav className="tdb-barre" aria-label="Navigation">
    <a href={CHEMINS.vue} onClick={lienInterne(naviguer, CHEMINS.vue)} className={`tdb-barre__onglet${ecran === 'vue' ? ' tdb-barre__onglet--actif' : ''}`} aria-current={ecran === 'vue' ? 'page' : undefined}>
      <Icone nom="activite" taille={20} />
      {/* « Vue d’ensemble » ne tient plus dans une case sur cinq : libellé court, nom complet pour les lecteurs d'écran. */}
      <span aria-hidden="true">Accueil</span>
      <span className="tdb-visuellement-cache">Vue d’ensemble</span>
    </a>
    <button type="button" onClick={onAlertes} className="tdb-barre__onglet">
      <Icone nom="cloche" taille={20} />
      Alertes
    </button>
    <a href={CHEMINS.documents} onClick={lienInterne(naviguer, CHEMINS.documents)} className={`tdb-barre__onglet${ecran === 'documents' ? ' tdb-barre__onglet--actif' : ''}`} aria-current={ecran === 'documents' ? 'page' : undefined}>
      <Icone nom="dossier" taille={20} />
      Documents
    </a>
    <a href={CHEMINS.signatures} onClick={lienInterne(naviguer, CHEMINS.signatures)} className={`tdb-barre__onglet${ecran === 'signatures' ? ' tdb-barre__onglet--actif' : ''}`} aria-current={ecran === 'signatures' ? 'page' : undefined}>
      <Icone nom="valide" taille={20} />
      Signatures
    </a>
    <a href={CHEMINS.securite} onClick={lienInterne(naviguer, CHEMINS.securite)} className={`tdb-barre__onglet${ecran === 'securite' ? ' tdb-barre__onglet--actif' : ''}`} aria-current={ecran === 'securite' ? 'page' : undefined}>
      <Icone nom="bouclier" taille={20} />
      Sécurité
    </a>
  </nav>
);
