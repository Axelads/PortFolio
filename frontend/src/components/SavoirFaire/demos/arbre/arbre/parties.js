import * as THREE from "three";
import { PIED, FOURCHE, CERCLE } from "./squelette";
import { surSegment, surTronc, autourDe, dansDome, surCercle } from "./echantillons";
import { tireur, auHasard } from "./tirage";

/** Le dôme qui enveloppe les pointes de la couronne. */
function mesurerDome(pointes) {
  const centre = pointes.reduce((c, { p }) => c.add(p), new THREE.Vector3()).divideScalar(pointes.length);
  const rx = Math.max(...pointes.map(({ p }) => Math.hypot(p.x - centre.x, p.z - centre.z)));
  const ry = Math.max(...pointes.map(({ p }) => p.y - centre.y));
  return { centre, rx: rx * 0.95, ry: ry * 1.05 };
}

/**
 * Une fonction par partie de l'arbre. Chacune renvoie un point, son genre
 * (0 bois, 1 feuillage, 2 cercle), sa place sur le chemin de la sève
 * (0 au bout des racines, 1 au bout des feuilles), sa souplesse au vent et sa taille.
 */
export function creerParties({ couronne, racines }) {
  const branche = tireur(couronne.segments);
  const racine = tireur(racines.segments);
  const rameaux = couronne.segments.filter((s) => s.niveau >= 2);
  const dome = mesurerDome(couronne.pointes);
  const seveCouronne = (l) => 0.5 + 0.38 * (l / couronne.portee);
  const surBranche = (s) => {
    const t = Math.random();
    return { p: surSegment(s, t), l: s.l0 + (s.l1 - s.l0) * t };
  };

  return {
    feuillage() {
      const tirage = Math.random();
      if (tirage < 0.2) return { p: dansDome(dome), genre: 1, seve: 0.84 + Math.random() * 0.16, souplesse: 1, taille: 0.85 };
      if (tirage < 0.75) {
        const pointe = auHasard(couronne.pointes);
        const c = pointe.p.clone().addScaledVector(pointe.dir, 0.08);
        return { p: autourDe(c, 0.26), genre: 1, seve: 0.86 + Math.random() * 0.14, souplesse: 1, taille: 1 };
      }
      const { p: [x, y, z], l } = surBranche(auHasard(rameaux));
      return { p: autourDe({ x, y, z }, 0.18), genre: 1, seve: seveCouronne(l), souplesse: 0.9, taille: 0.9 };
    },
    branches() {
      const { p, l } = surBranche(branche());
      return { p, genre: 0, seve: seveCouronne(l), souplesse: Math.pow(l / couronne.portee, 1.5), taille: 0.7 };
    },
    tronc() {
      const { p, t } = surTronc(PIED, FOURCHE);
      return { p, genre: 0, seve: 0.3 + 0.2 * t, souplesse: 0.08 * t, taille: 0.75 };
    },
    racines() {
      const { p, l } = surBranche(racine());
      return { p, genre: 0, seve: 0.3 * (1 - l / racines.portee), souplesse: 0, taille: 0.6 };
    },
    cercle: () => ({ p: surCercle(CERCLE), genre: 2, seve: -1, souplesse: 0, taille: 0.55 }),
  };
}
