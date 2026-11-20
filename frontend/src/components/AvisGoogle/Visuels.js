import React, { forwardRef, useState } from 'react';

// Logo « G » de Google (quatre couleurs officielles) et rangée d'étoiles, partagés par le portrait et le carrousel.
// Décoratifs : l'information (note, nombre, source) est toujours donnée en texte à côté ou dans l'aria-label du lien.

export const LogoGoogle = ({ className }) => (
  <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const CHEMIN_ETOILE = 'M12 2.4l2.95 5.98 6.6.96-4.78 4.65 1.13 6.57L12 17.46l-5.9 3.1 1.13-6.57-4.78-4.65 6.6-.96z';

const CinqEtoiles = () =>
  Array.from({ length: 5 }, (_, i) => (
    <svg key={i} className="etoiles-google__etoile" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={CHEMIN_ETOILE} />
    </svg>
  ));

/** Cinq étoiles grises, recouvertes d'étoiles jaunes rognées à droite selon la note (4,5 = quatre et demie). */
export const Etoiles = forwardRef(({ note, className = '' }, refPlein) => {
  const vide = 100 - (note / 5) * 100;
  return (
    <span className={`etoiles-google ${className}`} aria-hidden="true">
      <span className="etoiles-google__fond">
        <CinqEtoiles />
      </span>
      <span ref={refPlein} className="etoiles-google__plein" style={{ clipPath: `inset(0% ${vide}% 0% 0%)` }}>
        <CinqEtoiles />
      </span>
    </span>
  );
});
Etoiles.displayName = 'Etoiles';

// Initiales (deux lettres) quand l'auteur n'a pas de photo ou qu'elle ne charge pas.
export const initiales = (nom) =>
  String(nom)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0].toUpperCase())
    .join('');

// Photo du compte Google de l'auteur (sans référent : Google refuse parfois l'image sinon), initiales en repli.
// Google la sert en 128 px (« =s128 ») : demandée en 192 px pour rester nette sur écran dense.
const photoNette = (url) => url.replace(/=s\d+(?=-|$)/, '=s192');

/** Photo de l'auteur d'un avis Google (carrousel du pied de page, page /Avis). */
export const AvatarGoogle = ({ avis, className }) => {
  const [enEchec, setEnEchec] = useState(false);
  if (!avis.photo || enEchec) {
    return (
      <div className={`${className} ${className}--initiales`} role="img" aria-label={avis.auteur}>
        {initiales(avis.auteur)}
      </div>
    );
  }
  return (
    <img
      src={photoNette(avis.photo)}
      alt={avis.auteur}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setEnEchec(true)}
    />
  );
};
