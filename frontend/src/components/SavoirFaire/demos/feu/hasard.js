// Hasard reproductible : le même spectacle se reconstruit à l'identique après un redimensionnement.
export function creerHasard(graine = 2015) {
  let a = graine >>> 0;
  const suivant = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    suivant,
    entre: (min, max) => min + (max - min) * suivant(),
    // Direction au hasard sur une sphère.
    direction() {
      const z = suivant() * 2 - 1;
      const angle = suivant() * Math.PI * 2;
      const r = Math.sqrt(1 - z * z);
      return [Math.cos(angle) * r, Math.sin(angle) * r, z];
    },
  };
}
