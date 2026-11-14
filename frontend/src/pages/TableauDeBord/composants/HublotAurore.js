import React, { useId, useLayoutEffect, useRef } from 'react';
import { mouvementReduit } from '../outils';

/*
 * Marque « Hublot d'aurore » du tableau de bord : un hublot où l'aurore du fond est devenue de l'eau.
 * Validée par Axel le 14/10/2026 sur la planche de choix (artifact « Marque du tableau de bord »), elle remplace
 * le point dégradé de l'en-tête. Grammaire G07 « remplissage liquide » (journal : animations-realisees.md).
 *
 * Tout le mouvement passe par transform et opacity (WAAPI) sur un vectoriel de 22 px, sans filtre ni flou :
 * c'est la seule boucle permanente du tableau de bord, demandée explicitement (« une eau qui bouge constamment »).
 * Sous prefers-reduced-motion, rien ne démarre : le dessin est déjà dans son état final.
 */

// ───── Surfaces d'eau (repère local du niveau, x de -96 à 144, période 48) ─────
// Une houle longue (48) et un clapot court (16) superposés : des crêtes inégales, jamais une sinusoïde.
// Chaque nappe a sa phase et sa hauteur, donc les trois ne s'alignent jamais. Calculé une fois au chargement.
const surface = (longue, courte, p1, p2, haut) => {
  const points = [];
  for (let x = -96; x <= 144; x += 1.5) {
    const y = haut + longue * Math.sin((2 * Math.PI * x) / 48 + p1) + courte * Math.sin((2 * Math.PI * x) / 16 + p2);
    points.push(`${x} ${y.toFixed(2)}`);
  }
  return points;
};
const nappe = (points) => `M${points.join(' L')} V30 H-96 Z`;
const ligne = (points) => `M${points.join(' L')}`;
const AVANT = surface(1.2, 0.5, 4.1, 2.6, 0);
const VAGUES = {
  fond: nappe(surface(1.9, 0.7, 0.4, 1.3, -2.2)),
  milieu: nappe(surface(1.5, 0.6, 2.3, 0.2, -0.9)),
  avant: nappe(AVANT),
  crete: ligne(AVANT),
};

// Courbes de la planche validée (SORTIE est la même que --tdb-courbe-sortie).
const EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';
const SORTIE = 'cubic-bezier(0.23, 1, 0.32, 1)';
const BACK = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const DOUX = 'cubic-bezier(0.45, 0, 0.55, 1)';
const DUREE_APPARITION = 2000;

const pointeurFin = () => window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
const animer = (element, images, options) => (element && element.animate ? element.animate(images, { fill: 'both', ...options }) : null);

/**
 * Vie au repos : trois nappes à trois vitesses (la plus proche la plus rapide, celle du milieu à contresens, donc les
 * crêtes se croisent), roulis du hublot et respiration du niveau à des périodes différentes pour ne jamais se répéter
 * à l'identique, et une lueur qui dérive sous la surface.
 */
function vivre(svg) {
  const q = (s) => svg.querySelector(s);
  return [
    animer(q('.tdb-hublot__fond'), [{ transform: 'translateX(0)' }, { transform: 'translateX(-48px)' }], { duration: 7600, iterations: Infinity, easing: 'linear' }),
    animer(q('.tdb-hublot__milieu'), [{ transform: 'translateX(-48px)' }, { transform: 'translateX(0)' }], { duration: 5300, iterations: Infinity, easing: 'linear' }),
    animer(q('.tdb-hublot__avant'), [{ transform: 'translateX(0)' }, { transform: 'translateX(-48px)' }], { duration: 4100, iterations: Infinity, easing: 'linear' }),
    animer(q('.tdb-hublot__roulis'), [{ transform: 'rotate(-2.2deg)' }, { transform: 'rotate(2.2deg)' }], { duration: 6800, iterations: Infinity, direction: 'alternate', easing: DOUX }),
    animer(q('.tdb-hublot__houle'), [{ transform: 'translateY(0.35px)' }, { transform: 'translateY(-0.35px)' }], { duration: 4300, iterations: Infinity, direction: 'alternate', easing: DOUX }),
    animer(q('.tdb-hublot__lueur'), [{ transform: 'translate(-5px, 0)', opacity: 0.12 }, { transform: 'translate(6px, 2px)', opacity: 0.3 }], { duration: 9000, iterations: Infinity, direction: 'alternate', easing: DOUX }),
  ];
}

/**
 * Apparition (G07) : l'eau monte en trois nappes lancées vite dans leur sens de dérive puis ralenties jusqu'à leur
 * vitesse de croisière, dépasse son niveau, retombe et se pose en horizon ; un reflet passe sur le verre, une étoile
 * s'allume. `delai` (ms) cale le départ sur l'entrée du parent (rideau du générique, carte de connexion).
 */
function apparaitre(svg, delai) {
  const q = (s) => svg.querySelector(s);
  const elans = svg.querySelectorAll('.tdb-hublot__elan');
  return [
    animer(q('.tdb-hublot__niveau'), [
      { transform: 'translateY(46px)', easing: EXPO },
      { transform: 'translateY(23.8px)', offset: 0.72, easing: DOUX },
      { transform: 'translateY(26.6px)', offset: 0.88, easing: DOUX },
      { transform: 'translateY(26px)' },
    ], { duration: 1500, delay: delai + 100 }),
    animer(elans[0], [{ transform: 'translateX(44px)' }, { transform: 'translateX(0)' }], { duration: 1900, delay: delai + 100, easing: SORTIE }),
    animer(elans[1], [{ transform: 'translateX(-34px)' }, { transform: 'translateX(0)' }], { duration: 1800, delay: delai + 100, easing: SORTIE }),
    animer(elans[2], [{ transform: 'translateX(56px)' }, { transform: 'translateX(0)' }], { duration: 1700, delay: delai + 100, easing: SORTIE }),
    animer(q('.tdb-hublot__reflet'), [{ opacity: 0, strokeDasharray: '0 40' }, { opacity: 0.35, strokeDasharray: '40 0' }], { duration: 420, delay: delai + 1350, easing: SORTIE }),
    animer(q('.tdb-hublot__etoile'), [{ opacity: 0, transform: 'scale(0)' }, { opacity: 1, transform: 'scale(1.6)', offset: 0.6 }, { opacity: 1, transform: 'scale(1)' }], { duration: 420, delay: delai + 1550, easing: BACK }),
  ];
}

/** Clapot : la vague de surface recule, celle du milieu avance, le niveau monte d'un souffle. Sans fill : s'efface seul. */
function clapoter(svg) {
  const elans = svg.querySelectorAll('.tdb-hublot__elan');
  animer(elans[2], [{ transform: 'translateX(0)' }, { transform: 'translateX(-12px)', offset: 0.45 }, { transform: 'translateX(0)' }], { duration: 700, easing: DOUX, fill: 'none' });
  animer(elans[1], [{ transform: 'translateX(0)' }, { transform: 'translateX(7px)', offset: 0.5 }, { transform: 'translateX(0)' }], { duration: 760, easing: DOUX, fill: 'none' });
  animer(svg.querySelector('.tdb-hublot__niveau'), [{ transform: 'translateY(26px)' }, { transform: 'translateY(24.6px)', offset: 0.4 }, { transform: 'translateY(26px)' }], { duration: 700, easing: DOUX, fill: 'none' });
}

/**
 * @param {object} props
 * @param {number} [props.taille=22] Côté en px (le dessin est en 48 × 48).
 * @param {boolean} [props.apparition=false] Joue le remplissage au montage (générique, écran de connexion) ;
 *   sinon l'eau est déjà là, et vit.
 * @param {number} [props.delai=0] Retard de l'apparition en ms, pour partir avec l'entrée du parent.
 * @param {string} [props.className]
 */
export default function HublotAurore({ taille = 22, apparition = false, delai = 0, className = '' }) {
  // useId donne « :r1: » : les deux-points sortent des identifiants, qui servent dans des url(#…).
  const id = `tdb-hublot-${useId().replace(/:/g, '')}`;
  const ref = useRef(null);

  // Avant la première peinture : pas d'image avec l'eau déjà pleine avant que le remplissage ne commence.
  useLayoutEffect(() => {
    const svg = ref.current;
    if (!svg || mouvementReduit()) return undefined;
    const animations = [...vivre(svg), ...(apparition ? apparaitre(svg, delai) : [])];
    const fin = apparition ? performance.now() + delai + DUREE_APPARITION : 0;
    // Le parent (lien de marque, titre de la carte de connexion) porte le survol : la marque réagit avec son texte.
    const parent = svg.parentElement;
    const survoler = () => pointeurFin() && performance.now() > fin && clapoter(svg);
    const focaliser = () => performance.now() > fin && clapoter(svg);
    parent?.addEventListener('pointerenter', survoler);
    parent?.addEventListener('focus', focaliser);
    return () => {
      parent?.removeEventListener('pointerenter', survoler);
      parent?.removeEventListener('focus', focaliser);
      animations.forEach((animation) => animation?.cancel());
    };
  }, [apparition, delai]);

  return (
    <svg ref={ref} className={`tdb-hublot ${className}`.trim()} width={taille} height={taille} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={`${id}-c`}>
          <circle cx="24" cy="24" r="16.2" />
        </clipPath>
        {/* Nappe du milieu : menthe vers bleu. */}
        <linearGradient id={`${id}-m`} x1="0" y1="-3" x2="0" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" className="tdb-hublot__stop-a" />
          <stop offset="1" className="tdb-hublot__stop-b" />
        </linearGradient>
        {/* Vague de surface : éclat sur les crêtes, menthe, bleu, puis profondeur. */}
        <linearGradient id={`${id}-p`} x1="0" y1="-2" x2="0" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" className="tdb-hublot__stop-eclat" stopOpacity="0.55" />
          <stop offset="0.08" className="tdb-hublot__stop-a" />
          <stop offset="0.5" className="tdb-hublot__stop-b" />
          <stop offset="1" className="tdb-hublot__stop-profond" />
        </linearGradient>
        {/* Lueur sous la surface. */}
        <radialGradient id={`${id}-l`}>
          <stop offset="0" className="tdb-hublot__stop-eclat" />
          <stop offset="1" className="tdb-hublot__stop-eclat" stopOpacity="0" />
        </radialGradient>
        {/* Épaisseur du verre : le pourtour s'assombrit. */}
        <radialGradient id={`${id}-v`}>
          <stop offset="0.62" className="tdb-hublot__stop-ombre" stopOpacity="0" />
          <stop offset="1" className="tdb-hublot__stop-ombre" stopOpacity="0.32" />
        </radialGradient>
      </defs>
      <circle className="tdb-hublot__verre" cx="24" cy="24" r="18" />
      <g clipPath={`url(#${id}-c)`}>
        <g className="tdb-hublot__roulis">
          <g className="tdb-hublot__niveau" transform="translate(0 26)">
            <g className="tdb-hublot__houle">
              <g className="tdb-hublot__fond"><g className="tdb-hublot__elan"><path d={VAGUES.fond} /></g></g>
              <g className="tdb-hublot__milieu"><g className="tdb-hublot__elan"><path d={VAGUES.milieu} fill={`url(#${id}-m)`} /></g></g>
              <g className="tdb-hublot__avant">
                <g className="tdb-hublot__elan">
                  <path d={VAGUES.avant} fill={`url(#${id}-p)`} />
                  <path className="tdb-hublot__crete" d={VAGUES.crete} />
                </g>
              </g>
              <ellipse className="tdb-hublot__lueur" cx="24" cy="6" rx="7.5" ry="2.4" fill={`url(#${id}-l)`} />
            </g>
          </g>
        </g>
        <circle cx="24" cy="24" r="16.2" fill={`url(#${id}-v)`} />
      </g>
      <circle className="tdb-hublot__etoile" cx="30" cy="15.5" r="1.5" />
      <path className="tdb-hublot__reflet" d="M12.5 19.5 A12.5 12.5 0 0 1 19.5 11.8" />
    </svg>
  );
}
