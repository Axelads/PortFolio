/** Cumule des poids, pour un tirage pondéré. */
export function cumuler(poids) {
  let cumul = 0;
  return poids.map((p) => (cumul += p));
}

/** Index tiré au hasard dans des poids cumulés. */
export function choisir(cumuls) {
  const tirage = Math.random() * cumuls.at(-1);
  return cumuls.findIndex((c) => tirage <= c);
}

/** Tirage pondéré par la longueur et l'épaisseur : les grosses branches portent plus de points. */
export function tireur(segments) {
  const cumuls = cumuler(segments.map((s) => (s.l1 - s.l0) * (s.r0 + 0.02)));
  return () => segments[choisir(cumuls)];
}

export const auHasard = (liste) => liste[Math.floor(Math.random() * liste.length)];
