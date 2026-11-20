/** Cohérence cardiaque : 5 s d'inspiration, 5 s d'expiration. */
export const PERIODE = 10;

/**
 * Horloge du souffle. Diffuse `souffle:phase` ({ phase, cycle }) à chaque
 * changement, et se recale sur `souffle:guide` quand le guide démarre.
 */
export function creerHorloge() {
  let origine = performance.now();
  let derniere = "";
  let cycle = 0;

  const surGuide = (e) => {
    if (!e.detail?.actif) return;
    origine = performance.now();
    derniere = "";
    cycle = 0;
  };
  window.addEventListener("souffle:guide", surGuide);

  function lire(maintenant) {
    const t = (maintenant - origine) / 1000;
    const avancee = (t % PERIODE) / PERIODE;
    const phase = avancee < 0.5 ? "inspire" : "expire";
    if (phase !== derniere) {
      if (phase === "inspire" && derniere !== "") cycle += 1;
      derniere = phase;
      window.dispatchEvent(new CustomEvent("souffle:phase", { detail: { phase, cycle } }));
    }
    return { t, souffle: 0.5 - 0.5 * Math.cos(avancee * Math.PI * 2) };
  }

  return { lire, detacher: () => window.removeEventListener("souffle:guide", surGuide) };
}
