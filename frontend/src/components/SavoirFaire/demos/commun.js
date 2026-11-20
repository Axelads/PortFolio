// Outils partagés par les démos WebGL de la section Savoir-faire.

// Le contexte d'essai est rendu tout de suite : le navigateur limite le nombre de contextes WebGL ouverts.
export function webglDisponible() {
  try {
    const toile = document.createElement('canvas');
    const contexte = toile.getContext('webgl2') || toile.getContext('webgl');
    contexte?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(contexte);
  } catch {
    return false;
  }
}

export const mouvementReduit = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Prévient quand la scène doit tourner ou s'arrêter (un peu avant qu'elle n'entre à l'écran).
// IntersectionObserver plutôt que `contentvisibilityautostatechange` : le moteur est chargé à part, après le
// premier rendu de la scène, et l'événement déjà parti ne revient pas ; l'observateur, lui, donne l'état initial.
export function surveillerVisibilite(hote, rappel) {
  const observateur = new IntersectionObserver(([entree]) => rappel(entree.isIntersecting), { rootMargin: '200px 0px' });
  observateur.observe(hote);
  return () => observateur.disconnect();
}

// Boucle d'images qui ne tourne que quand la scène est rendue et l'onglet visible.
// `image(dt, maintenant)` reçoit un pas de temps borné (pas de saut après une pause).
export function lancerBoucle(hote, image) {
  let visible = false;
  let raf = 0;
  let precedent = 0;

  const tour = (maintenant) => {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = precedent ? Math.min(0.05, (maintenant - precedent) / 1000) : 0;
    precedent = maintenant;
    image(dt, maintenant);
    raf = requestAnimationFrame(tour);
  };
  const relancer = () => {
    if (raf || !visible || document.hidden) return;
    precedent = 0;
    raf = requestAnimationFrame(tour);
  };

  const arreterSurveillance = surveillerVisibilite(hote, (estVisible) => {
    visible = estVisible;
    relancer();
  });
  document.addEventListener('visibilitychange', relancer);

  return () => {
    arreterSurveillance();
    document.removeEventListener('visibilitychange', relancer);
    if (raf) cancelAnimationFrame(raf);
  };
}

// Suit la taille de l'hôte (redimensionnement de la fenêtre, rotation du téléphone).
export function suivreTaille(hote, rappel) {
  let attente = 0;
  const observateur = new ResizeObserver(() => {
    cancelAnimationFrame(attente);
    attente = requestAnimationFrame(rappel);
  });
  observateur.observe(hote);
  return () => {
    cancelAnimationFrame(attente);
    observateur.disconnect();
  };
}
