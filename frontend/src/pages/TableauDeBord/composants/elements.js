import React, { useEffect, useRef, useState } from 'react';
import Icone from './Icone';
import { useCompteur } from '../mouvement';
import { formaterNombre } from '../outils';

// Composants de la maquette Figma (page « Composants »), un par composant Figma.

/** Pastille d'état : en-ligne, accent, alerte, panne, inconnu. `onde` : une seule onde à l'apparition. */
export const Pastille = ({ etat = 'inconnu', taille = 'normale', onde = false }) => (
  <span className={`tdb-pastille tdb-pastille--${etat} tdb-pastille--${taille}${onde ? ' tdb-pastille--onde' : ''}`} aria-hidden="true" />
);

/** Badge : neutre, accent, en-ligne, alerte, panne. */
export const Badge = ({ ton = 'neutre', children }) => <span className={`tdb-badge tdb-badge--${ton}`}>{children}</span>;

/** Bouton : principal, secondaire, fantôme ; icône facultative. */
export const Bouton = ({ variante = 'principal', icone, children, className = '', type = 'button', ...reste }) => (
  <button type={type} className={`tdb-bouton tdb-bouton--${variante} ${className}`.trim()} {...reste}>
    {icone && <Icone nom={icone} taille={16} />}
    <span>{children}</span>
  </button>
);

/** Groupe d'onglets en pilules (filtres, onglets de fiche, filtres du journal). */
export const Onglets = ({ elements, actif, onChoisir, libelle, className = '' }) => (
  <div className={`tdb-onglets ${className}`.trim()} role="tablist" aria-label={libelle}>
    {elements.map((e) => (
      <button
        key={e.cle}
        type="button"
        role="tab"
        aria-selected={actif === e.cle}
        className={`tdb-onglet${actif === e.cle ? ' tdb-onglet--actif' : ''}`}
        onClick={() => onChoisir(e.cle)}
      >
        {e.libelle}
      </button>
    ))}
  </div>
);

/** Panneau en verre dépoli avec son titre. `style` → index de cascade (--i). */
export const Panneau = ({ titre, compteur, action, id, className = '', children, i = 0 }) => (
  <section className={`tdb-panneau ${className}`.trim()} aria-labelledby={id ? `${id}-titre` : undefined} id={id} style={{ '--i': i }}>
    {(titre || action) && (
      <header className="tdb-panneau__tete">
        <h2 className="tdb-panneau__titre" id={id ? `${id}-titre` : undefined}>
          {titre}
          {compteur != null && <span className="tdb-panneau__compteur">{compteur}</span>}
        </h2>
        {action}
      </header>
    )}
    {children}
  </section>
);

/** Emplacement d'une source pas encore reliée : jamais de chiffre inventé à la place. */
export const SourceNonBranchee = ({ titre = 'Source non branchée', children, compact = false }) => (
  <div className={`tdb-source${compact ? ' tdb-source--compacte' : ''}`}>
    <Icone nom="prise" taille={compact ? 18 : 22} />
    <p className="tdb-source__titre">{titre}</p>
    <p className="tdb-source__explication">{children}</p>
  </div>
);

/** Lien vers une console ou un site, ouvert dans un nouvel onglet sans transmettre l'adresse de la page. */
export const LienConsole = ({ lien, icone }) => (
  <a className="tdb-lien" href={lien.url} target="_blank" rel="noopener noreferrer" title={lien.libelle}>
    <Icone nom={icone} taille={18} />
    <span className="tdb-lien__libelle">{lien.libelle}</span>
    <Icone nom="lien-externe" taille={14} className="tdb-lien__externe" />
  </a>
);

/** Commande à copier : fondu croisé vers « Copié », retour automatique après 1,5 s. */
export const BlocCommande = ({ libelle, commande, description }) => {
  const [copie, setCopie] = useState(false);
  const minuteur = useRef(null);
  const codeRef = useRef(null);
  useEffect(() => () => clearTimeout(minuteur.current), []);
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(commande);
    } catch {
      // presse-papiers refusé : on sélectionne la commande pour un Ctrl+C manuel
      const plage = document.createRange();
      plage.selectNodeContents(codeRef.current);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(plage);
      return;
    }
    setCopie(true);
    clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => setCopie(false), 1500);
  };
  return (
    <div className="tdb-commande">
      <p className="tdb-commande__libelle" title={description || undefined}>
        {libelle}
      </p>
      <div className="tdb-commande__ligne">
        <code ref={codeRef} className="tdb-commande__code">
          {commande}
        </code>
        <button type="button" className={`tdb-commande__copier${copie ? ' tdb-commande__copier--fait' : ''}`} onClick={copier} aria-label={copie ? 'Commande copiée' : `Copier : ${commande}`}>
          <span className="tdb-commande__etat tdb-commande__etat--repos" aria-hidden={copie}>
            <Icone nom="copier" taille={14} /> Copier
          </span>
          <span className="tdb-commande__etat tdb-commande__etat--fait" aria-hidden={!copie}>
            <Icone nom="valide" taille={14} /> Copié
          </span>
        </button>
      </div>
      <span className="tdb-visuellement-cache" role="status" aria-live="polite">
        {copie ? 'Commande copiée dans le presse-papiers' : ''}
      </span>
    </div>
  );
};

/** Ligne d'alerte : gravité panne, alerte ou info. */
export const LigneAlerte = ({ gravite, titre, detail, temps, nouvelle = false }) => (
  <li className="tdb-ligne tdb-ligne--alerte">
    <Pastille etat={{ panne: 'panne', alerte: 'alerte', info: 'inconnu' }[gravite] || 'inconnu'} onde={nouvelle && gravite === 'panne'} />
    <span className="tdb-ligne__textes">
      <span className="tdb-ligne__titre">{titre}</span>
      {detail && <span className="tdb-ligne__detail">{detail}</span>}
    </span>
    {temps && <span className="tdb-ligne__temps">{temps}</span>}
  </li>
);

/** Ligne d'activité ou d'échéance : icône, texte, temps. */
export const LigneActivite = ({ icone, texte, temps, detail, lien, etat }) => (
  <li className="tdb-ligne tdb-ligne--activite">
    <span className={`tdb-ligne__icone${etat ? ` tdb-ligne__icone--${etat}` : ''}`}>
      <Icone nom={icone} taille={16} />
    </span>
    <span className="tdb-ligne__textes">
      {lien ? (
        <a className="tdb-ligne__texte tdb-ligne__lien" href={lien} target="_blank" rel="noopener noreferrer">
          {texte}
        </a>
      ) : (
        <span className="tdb-ligne__texte">{texte}</span>
      )}
      {detail && <span className="tdb-ligne__detail">{detail}</span>}
    </span>
    {temps && <span className="tdb-ligne__temps">{temps}</span>}
  </li>
);

/** Valeur chiffrée qui défile jusqu'à sa cible (900 ms), en chiffres tabulaires. */
export const Compteur = ({ valeur, formater = (v) => formaterNombre(Math.round(v)), delai = 0 }) => {
  const courante = useCompteur(valeur, delai);
  return (
    <>
      <span aria-hidden="true">{formater(courante)}</span>
      <span className="tdb-visuellement-cache">{formater(valeur)}</span>
    </>
  );
};

/** Titre révélé mot par mot : chaque mot monte dans son masque. */
export const TitreRevele = ({ texte, niveau: Balise = 'h1', className = '', id }) => (
  <Balise className={`tdb-revele ${className}`.trim()} id={id} aria-label={texte}>
    {texte.split(' ').map((mot, i) => (
      <React.Fragment key={`${mot}-${i}`}>
        {i > 0 && ' '}
        <span className="tdb-revele__masque" aria-hidden="true">
          <span className="tdb-revele__mot" style={{ '--i': i }}>
            {mot}
          </span>
        </span>
      </React.Fragment>
    ))}
  </Balise>
);
