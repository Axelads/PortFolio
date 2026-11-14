import React, { useState } from 'react';
import { CHEMINS, URL_API_TABLEAU_DE_BORD } from '../constantes';
import { useInclinaison } from '../mouvement';
import { formaterEuros, marqueProjet, PASTILLE_SANTE, resumerSante, STATUTS, TYPES } from '../outils';
import { Pastille } from './elements';

/**
 * Logo du projet : sa tuile servie par l'API (session requise, adresse versionnée donc gardée en cache). Sans logo
 * propre, ou si l'image ne charge pas, son initiale sur sa couleur d'accent.
 */
export const LogoProjet = ({ projet, taille = 36, nommer = false }) => {
  const [enEchec, setEnEchec] = useState(false);
  const nom = nommer ? 'tdb-projet-logo' : undefined;
  if (projet.logo && !enEchec) {
    return (
      <span className={`tdb-logo tdb-logo--image tdb-logo--${projet.logo.affichage}`} style={{ '--taille': `${taille}px`, viewTransitionName: nom }} aria-hidden="true">
        <img
          src={`${URL_API_TABLEAU_DE_BORD}/logos/${projet.slug}?v=${projet.logo.version}`}
          alt=""
          width={taille}
          height={taille}
          decoding="async"
          onError={() => setEnEchec(true)}
        />
      </span>
    );
  }
  const { initiale, fond, texte } = marqueProjet(projet);
  return (
    <span className="tdb-logo" style={{ '--taille': `${taille}px`, background: fond, color: texte, viewTransitionName: nom }} aria-hidden="true">
      {initiale}
    </span>
  );
};

/**
 * Carte projet (composant Figma « Carte projet » : grande, moyenne, petite). C'est un vrai lien : clic du milieu
 * et ouverture dans un nouvel onglet fonctionnent ; le clic simple joue la transition vers la fiche.
 */
const CarteProjet = ({ projet, taille, coutMensuel, sante, i, nommer, onOuvrir }) => {
  const ref = useInclinaison();
  const statut = STATUTS[projet.statut];
  const ouvrir = (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onOuvrir(projet, e.currentTarget);
  };
  return (
    <a
      ref={ref}
      href={CHEMINS.fiche(projet.slug)}
      onClick={ouvrir}
      className={`tdb-carte tdb-carte--${taille}`}
      style={{ '--i': i, viewTransitionName: nommer ? 'tdb-projet' : undefined }}
      data-slug={projet.slug}
    >
      <span className="tdb-carte__reflet" aria-hidden="true" />
      <span className="tdb-carte__identite">
        <LogoProjet projet={projet} nommer={nommer} />
        <span className="tdb-carte__noms">
          <span className="tdb-carte__nom">{projet.nom}</span>
          <span className="tdb-carte__type">
            {TYPES[projet.type]}
            {sante && ` · ${statut.libelle}`}
          </span>
        </span>
      </span>
      {/* Avec une vérification en direct : l'état réel du site / PocketBase ; sinon, le statut de l'inventaire. */}
      <span className="tdb-carte__statut">
        <Pastille etat={sante ? PASTILLE_SANTE[sante.etat] : statut.etat} onde={sante?.etat === 'panne' && projet.statut === 'production'} />
        <span>{sante ? resumerSante(sante) : statut.libelle}</span>
      </span>
      {taille !== 'petite' && projet.notes?.[0] && <span className="tdb-carte__note">{projet.notes[0]}</span>}
      {taille === 'grande' && coutMensuel > 0 && (
        <span className="tdb-carte__cle">
          <span className="tdb-carte__valeur">{formaterEuros(coutMensuel, { centimes: true })}</span>
          <span className="tdb-carte__unite">par mois</span>
        </span>
      )}
    </a>
  );
};

export default CarteProjet;
