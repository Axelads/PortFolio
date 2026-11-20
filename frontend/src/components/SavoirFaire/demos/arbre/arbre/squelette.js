import * as THREE from "three";
import { ramifier } from "./ramifier";

/** Hauteurs clés de l'arbre, reprises par le shader. */
export const PIED = -0.85;
export const FOURCHE = 0.05;
/** Le cercle du symbole, ouvert en haut comme l'arc du logo. */
export const CERCLE = { rayon: 1.95, centreY: 0.08, ouverture: 0.62 };

const HAUT = new THREE.Vector3(0, 1, 0);
const BAS = new THREE.Vector3(0, -1, 0);

const COURONNE = {
  depart: new THREE.Vector3(0, FOURCHE, 0),
  axe: HAUT,
  nombre: 5,
  niveaux: 4,
  enfants: [3, 2, 2],
  ouverture: [1.0, 0.6, 0.55, 0.5],
  ecart: 0.2,
  longueur: 0.56,
  reduction: 0.76,
  rayon: 0.07,
  finesse: 0.62,
  tropisme: HAUT,
  force: 0.1,
  evasement: 0.22,
};

// Les racines répondent à la couronne, en miroir, plus fines et plus plates.
const RACINES = {
  depart: new THREE.Vector3(0, PIED, 0),
  axe: BAS,
  nombre: 5,
  niveaux: 3,
  enfants: [2, 2],
  ouverture: [1.2, 0.45, 0.4],
  ecart: 0.12,
  longueur: 0.5,
  reduction: 0.72,
  rayon: 0.055,
  finesse: 0.55,
  tropisme: BAS,
  force: 0.16,
  evasement: 0.12,
};

export function construireSquelette(hasard) {
  return { couronne: ramifier(COURONNE, hasard), racines: ramifier(RACINES, hasard) };
}
