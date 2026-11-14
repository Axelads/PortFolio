import { useEffect, useRef, useState } from 'react';
import { mouvementReduit } from './outils';

// Tokens « Mouvement » de la maquette Figma, côté JavaScript (le CSS a les siens dans _jetons.scss).
export const MOUVEMENT = {
  compteurMs: 900,
  ressort: { rebond: 0.15, duree: 0.5 },
};

/** Courbe cubic-bezier évaluée en JavaScript (même définition que CSS). */
export function cubicBezier(x1, y1, x2, y2) {
  const coord = (t, a, b) => 3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  const pente = (t, a, b) => 3 * a * (1 - t) ** 2 + 6 * (b - a) * t * (1 - t) + 3 * (1 - b) * t ** 2;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i += 1) {
      const d = pente(t, x1, x2);
      if (Math.abs(d) < 1e-6) break;
      t -= (coord(t, x1, x2) - x) / d;
    }
    return coord(Math.min(1, Math.max(0, t)), y1, y2);
  };
}
const sortie = cubicBezier(0.23, 1, 0.32, 1);

/**
 * Valeur qui défile de 0 à `cible` en 900 ms au montage (immédiate si le mouvement est réduit). `delai` (ms) ne
 * s'applique qu'au premier défilement : dans le générique, le chiffre part quand son indicateur est révélé.
 */
export function useCompteur(cible, delai = 0) {
  const [valeur, setValeur] = useState(() => (mouvementReduit() ? cible : 0));
  const premier = useRef(true);
  useEffect(() => {
    if (mouvementReduit() || typeof cible !== 'number') {
      setValeur(cible);
      return undefined;
    }
    let image;
    const debut = performance.now() + (premier.current ? delai : 0);
    premier.current = false;
    const pas = (instant) => {
      const p = Math.min(1, Math.max(0, (instant - debut) / MOUVEMENT.compteurMs));
      setValeur(cible * sortie(p));
      if (p < 1) image = requestAnimationFrame(pas);
    };
    image = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(image);
  }, [cible, delai]);
  return valeur;
}

// Générique d'ouverture (motion v2) : joué au premier affichage de la vue d'ensemble dans cette page, rejoué
// seulement après une déconnexion. Un rechargement de la page le rejoue aussi (nouvel affichage de session).
const generique = { joue: false };
export const generiqueDejaJoue = () => generique.joue;
export const marquerGeneriqueJoue = () => {
  generique.joue = true;
};
export const reinitialiserGenerique = () => {
  generique.joue = false;
};

// Ressort « rebond 0,15 / 0,5 s » (même conversion que motion.dev : raideur et amortissement pour une masse de 1).
const RAIDEUR = (2 * Math.PI / MOUVEMENT.ressort.duree) ** 2;
const AMORTISSEMENT = 2 * (1 - MOUVEMENT.ressort.rebond) * Math.sqrt(RAIDEUR);
const INCLINAISON_MAX = 4; // degrés
const pointeurFin = () => window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

/**
 * Inclinaison 3D au pointeur (±4°) en ressort, avec un reflet qui suit le curseur. Bureau seulement
 * (souris ou trackpad) et jamais sous prefers-reduced-motion. Écrit `transform` directement sur l'élément :
 * pas de variable CSS héritée, pas de rendu React à chaque image.
 */
export function useInclinaison() {
  const ref = useRef(null);
  useEffect(() => {
    const carte = ref.current;
    if (!carte || !pointeurFin() || mouvementReduit()) return undefined;
    const reflet = carte.querySelector('.tdb-carte__reflet');
    const etat = { x: 0, y: 0, vx: 0, vy: 0, monte: 0, vm: 0, cx: 0, cy: 0, cm: 0 };
    let image = null;
    let precedent = 0;

    const dessiner = () => {
      carte.style.transform = `perspective(900px) rotateX(${etat.y.toFixed(3)}deg) rotateY(${etat.x.toFixed(3)}deg) translateY(${(-4 * etat.monte).toFixed(3)}px)`;
    };
    const pas = (instant) => {
      const dt = Math.min(0.032, (instant - (precedent || instant)) / 1000) || 1 / 60;
      precedent = instant;
      for (const [p, v, c] of [['x', 'vx', 'cx'], ['y', 'vy', 'cy'], ['monte', 'vm', 'cm']]) {
        const force = -RAIDEUR * (etat[p] - etat[c]) - AMORTISSEMENT * etat[v];
        etat[v] += force * dt;
        etat[p] += etat[v] * dt;
      }
      dessiner();
      const repos = ['x', 'y', 'monte'].every((p, i) => Math.abs(etat[p] - etat[['cx', 'cy', 'cm'][i]]) < 0.01) && Math.abs(etat.vx) + Math.abs(etat.vy) + Math.abs(etat.vm) < 0.01;
      if (repos) {
        image = null;
        precedent = 0;
        if (etat.cm === 0) carte.style.transform = '';
        return;
      }
      image = requestAnimationFrame(pas);
    };
    const relancer = () => {
      if (!image) image = requestAnimationFrame(pas);
    };
    const bouger = (e) => {
      const r = carte.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      etat.cx = (px - 0.5) * 2 * INCLINAISON_MAX;
      etat.cy = -(py - 0.5) * 2 * INCLINAISON_MAX;
      etat.cm = 1;
      if (reflet) reflet.style.transform = `translate(${(px * r.width).toFixed(1)}px, ${(py * r.height).toFixed(1)}px)`;
      relancer();
    };
    const sortir = () => {
      etat.cx = 0;
      etat.cy = 0;
      etat.cm = 0;
      relancer();
    };
    carte.addEventListener('pointermove', bouger);
    carte.addEventListener('pointerleave', sortir);
    return () => {
      carte.removeEventListener('pointermove', bouger);
      carte.removeEventListener('pointerleave', sortir);
      if (image) cancelAnimationFrame(image);
      carte.style.transform = '';
    };
  }, []);
  return ref;
}
