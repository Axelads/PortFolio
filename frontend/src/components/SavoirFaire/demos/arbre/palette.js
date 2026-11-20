import * as THREE from "three";

// Couleurs reprises des tokens Figma : or pâle, laiton des bols, lin, lotus clair, terre douce.
const OR = "#E4CFA5";
const LAITON = "#C9A46A";
const LIN = "#FBF7F0";
const LOTUS = "#6F93BC";
const TERRE = "#D9825E";

/** Couleurs de chaque partie de l'arbre, avec leur poids. */
const PALETTES = {
  feuillage: [[OR, 0.34], [LIN, 0.2], [LOTUS, 0.3], [LAITON, 0.1], [TERRE, 0.06]],
  branches: [[LAITON, 0.5], [OR, 0.4], [TERRE, 0.1]],
  tronc: [[LAITON, 0.5], [OR, 0.4], [TERRE, 0.1]],
  racines: [[LAITON, 0.45], [LOTUS, 0.35], [TERRE, 0.2]],
  cercle: [[OR, 0.6], [LAITON, 0.4]],
};

export function couleurDe(partie) {
  const palette = PALETTES[partie];
  let tirage = Math.random();
  for (const [couleur, poids] of palette) {
    tirage -= poids;
    if (tirage <= 0) return new THREE.Color(couleur);
  }
  return new THREE.Color(palette[0][0]);
}
