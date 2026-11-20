import * as THREE from "three";
import { couleurDe } from "./palette";
import { creerArbre } from "./arbre/creerArbre";

const ANNEAUX = [0.42, 0.85, 1.32, 1.84, 2.42, 3.06, 3.76];
const INCLINAISON = 1.08; // anneaux vus de trois quarts, comme un bol

/** Point sur un anneau, tiré au prorata de la circonférence. */
function pointAnneau() {
  const total = ANNEAUX.reduce((a, b) => a + b, 0);
  let tirage = Math.random() * total;
  let k = 0;
  while (k < ANNEAUX.length - 1 && tirage > ANNEAUX[k]) tirage -= ANNEAUX[k++];
  const r = ANNEAUX[k] + (Math.random() - 0.5) * 0.05;
  const a = Math.random() * Math.PI * 2;
  const [x, y, z] = [Math.cos(a) * r, (Math.random() - 0.5) * 0.03, Math.sin(a) * r];
  const [c, s] = [Math.cos(INCLINAISON), Math.sin(INCLINAISON)];
  return [x, y * c - z * s - 0.15, y * s + z * c];
}

/** Chaque particule a deux places : dans l'arbre de vie, puis sur les anneaux des ondes. */
export function construireGeometrie(n) {
  const tirer = creerArbre();
  const attributs = { position: [], aOnde: [], aAlea: [], aCouleur: [], aArbre: [] };
  for (let i = 0; i < n; i++) {
    const { partie, p, genre, seve, souplesse, taille } = tirer();
    attributs.position.push(...p);
    attributs.aOnde.push(...pointAnneau());
    attributs.aAlea.push(Math.random(), Math.random(), Math.random(), Math.pow(Math.random(), 1.6));
    const c = couleurDe(partie);
    attributs.aCouleur.push(c.r, c.g, c.b);
    attributs.aArbre.push(genre, seve, souplesse, taille);
  }
  const g = new THREE.BufferGeometry();
  for (const [nom, valeurs] of Object.entries(attributs)) {
    const taille = nom === "aAlea" || nom === "aArbre" ? 4 : 3;
    g.setAttribute(nom, new THREE.Float32BufferAttribute(valeurs, taille));
  }
  return g;
}
