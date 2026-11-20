/** Écart doux, entre -1 et 1, plus dense au centre. */
export const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

function direction() {
  const y = Math.random() * 2 - 1;
  const a = Math.random() * Math.PI * 2;
  const k = Math.sqrt(1 - y * y);
  return [k * Math.cos(a), y, k * Math.sin(a)];
}

/** Point sur une branche : la courbe de Bézier, épaissie selon son rayon. */
export function surSegment(s, t) {
  const u = 1 - t;
  const r = (s.r0 + (s.r1 - s.r0) * t) * Math.sqrt(Math.random());
  const [dx, dy, dz] = direction();
  const axe = (k) => u * u * s.a[k] + 2 * u * t * s.c[k] + t * t * s.b[k];
  return [axe("x") + dx * r, axe("y") + dy * r, axe("z") + dz * r];
}

/** Tronc torsadé : trois brins qui s'enroulent du pied à la fourche. */
export function surTronc(pied, fourche) {
  const t = Math.random();
  const brin = Math.floor(Math.random() * 3);
  const angle = (brin / 3) * Math.PI * 2 + t * Math.PI * 1.4;
  const r = 0.05 + 0.14 * Math.pow(1 - t, 2.2);
  const j = 0.028;
  const p = [Math.cos(angle) * r + gauss() * j, pied + (fourche - pied) * t + gauss() * j, Math.sin(angle) * r + gauss() * j];
  return { p, t };
}

/** Feuillage : un nuage doux autour d'un point de la couronne. */
export function autourDe(c, rayon) {
  return [c.x + gauss() * rayon, c.y + gauss() * rayon * 0.85, c.z + gauss() * rayon];
}

/** Feuillage du dôme : il arrondit la silhouette de la couronne, plus dense vers le bord. */
export function dansDome({ centre, rx, ry }) {
  const [dx, dy, dz] = direction();
  const k = Math.cbrt(0.35 + Math.random() * 0.65);
  return [centre.x + dx * rx * k, centre.y + dy * ry * k * (dy < 0 ? 0.55 : 1), centre.z + dz * rx * k];
}

/** Point sur le cercle, hors de l'ouverture du haut. */
export function surCercle({ rayon, centreY, ouverture }) {
  const a = Math.PI / 2 + ouverture + Math.random() * (Math.PI * 2 - 2 * ouverture);
  const r = rayon + gauss() * 0.012;
  return [Math.cos(a) * r, centreY + Math.sin(a) * r, gauss() * 0.02];
}
