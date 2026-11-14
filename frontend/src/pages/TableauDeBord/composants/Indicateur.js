import React from 'react';
import Icone from './Icone';
import { Compteur, Pastille } from './elements';

/**
 * Indicateur chiffré (composant Figma « Indicateur », taille Compact). Une source non reliée affiche un tiret
 * et le dit en toutes lettres : aucune valeur n'est jamais inventée.
 */
const Indicateur = ({ icone, libelle, valeur, formater, unite, contexte, fraicheur, etatFraicheur = 'en-ligne', nonBranche = false, i = 0, delai = 0 }) => (
  <article className={`tdb-indicateur${nonBranche ? ' tdb-indicateur--non-branche' : ''}`} style={{ '--i': i }}>
    <header className="tdb-indicateur__tete">
      <Icone nom={icone} taille={16} />
      <h3 className="tdb-indicateur__libelle">{libelle}</h3>
    </header>
    <p className="tdb-indicateur__valeur">
      <span className="tdb-indicateur__chiffre">{nonBranche || valeur == null ? '—' : typeof valeur === 'number' ? <Compteur valeur={valeur} formater={formater} delai={delai} /> : valeur}</span>
      {unite && <span className="tdb-indicateur__unite">{unite}</span>}
    </p>
    {contexte && <p className="tdb-indicateur__contexte">{contexte}</p>}
    <p className="tdb-indicateur__fraicheur">
      <Pastille etat={nonBranche ? 'inconnu' : etatFraicheur} taille="petite" />
      {nonBranche ? 'Source non branchée' : fraicheur}
    </p>
  </article>
);

export default Indicateur;
