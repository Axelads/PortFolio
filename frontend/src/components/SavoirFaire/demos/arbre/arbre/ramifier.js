import * as THREE from "three";

const X = new THREE.Vector3(1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);

/** Incline une direction d'un angle donné, du côté que désigne l'azimut. */
export function devier(dir, angle, azimut) {
  const u = new THREE.Vector3().crossVectors(dir, Math.abs(dir.y) > 0.95 ? X : Y).normalize();
  const v = new THREE.Vector3().crossVectors(dir, u);
  const cote = u.multiplyScalar(Math.cos(azimut)).addScaledVector(v, Math.sin(azimut));
  return dir.clone().multiplyScalar(Math.cos(angle)).addScaledVector(cote, Math.sin(angle)).normalize();
}

/**
 * Fait pousser une ramure (couronne ou racines) par divisions successives.
 * Chaque segment est une courbe de Bézier qui garde sa longueur cumulée
 * depuis le tronc : c'est elle qui règle le passage de la sève.
 */
export function ramifier(regle, hasard) {
  const segments = [];
  const pointes = [];
  const varier = (k) => 1 - k + hasard() * 2 * k;

  function pousser(depart, dir, longueur, rayon, niveau, cumul) {
    // La pousse se redresse (vers le ciel ou la terre) et s'écarte du tronc.
    const dehors = new THREE.Vector3(depart.x, 0, depart.z).normalize();
    const vers = dir.clone().addScaledVector(regle.tropisme, regle.force).addScaledVector(dehors, regle.evasement).normalize();
    const fin = depart.clone().addScaledVector(vers, longueur);
    const pli = depart.clone().addScaledVector(dir, longueur * 0.55);
    segments.push({ a: depart, c: pli, b: fin, r0: rayon, r1: rayon * regle.finesse, l0: cumul, l1: cumul + longueur, niveau });
    if (niveau === regle.niveaux - 1) {
      pointes.push({ p: fin, dir: vers, l: cumul + longueur });
      return;
    }
    const n = regle.enfants[niveau];
    const tour = hasard() * Math.PI * 2;
    for (let k = 0; k < n; k++) {
      const azimut = tour + (k / n) * Math.PI * 2 + (hasard() - 0.5) * 0.8;
      const enfant = devier(vers, regle.ouverture[niveau + 1] * varier(0.25), azimut);
      pousser(fin, enfant, longueur * regle.reduction * varier(0.15), rayon * regle.finesse, niveau + 1, cumul + longueur);
    }
  }

  for (let k = 0; k < regle.nombre; k++) {
    const azimut = (k / regle.nombre) * Math.PI * 2 + (hasard() - 0.5) * 0.5;
    pousser(regle.depart, devier(regle.axe, regle.ouverture[0] * varier(regle.ecart), azimut), regle.longueur, regle.rayon, 0, 0);
  }
  return { segments, pointes, portee: Math.max(...pointes.map((p) => p.l)) };
}
