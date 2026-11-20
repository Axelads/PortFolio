const amortir = (actuel, but, dt, vitesse = 4.5) => actuel + (but - actuel) * (1 - Math.exp(-vitesse * dt));

/**
 * Boucle d'animation : lit l'horloge du souffle, rejoint les cibles du
 * scroll en douceur, et ne dessine rien hors écran ou une fois effacée.
 */
export function lancerBoucle({ scene3d, cible, horloge, pointeur, decalage, lueur, estVisible }) {
  const { rendu, scene, camera, points, uniforms } = scene3d;
  const pointeurLocal = pointeur.position.clone();
  let raf = 0;
  let precedent = performance.now();

  function image(maintenant) {
    raf = requestAnimationFrame(image);
    const dt = Math.min(0.05, (maintenant - precedent) / 1000);
    precedent = maintenant;
    if (!estVisible() || document.hidden) return;
    if (uniforms.uOpacite.value < 0.004 && cible.opacite < 0.004) return;

    const { t, souffle } = horloge.lire(maintenant);
    const u = uniforms;
    u.uTemps.value = t;
    u.uSouffle.value = souffle;
    u.uRotation.value += dt * 0.06;
    u.uEclat.value = amortir(u.uEclat.value, cible.eclat, dt);
    u.uOndes.value = amortir(u.uOndes.value, cible.ondes, dt, 3.2);
    u.uOndule.value = amortir(u.uOndule.value, cible.ondule, dt, 3);
    u.uOpacite.value = amortir(u.uOpacite.value, cible.opacite, dt, 2.6);

    // L'arbre se décale à côté du titre, puis revient au centre pour les ondes.
    const libre = cible.centre ? 0 : 1 - Math.min(1, u.uEclat.value + u.uOndes.value);
    points.position.x = amortir(points.position.x, decalage.x * libre, dt, 3);
    points.position.y = amortir(points.position.y, decalage.y * libre + cible.decalageY, dt, 3);

    // Le pointeur est lu dans la scène : on le ramène dans le repère de l'arbre décalé.
    pointeurLocal.copy(pointeur.position).sub(points.position);
    u.uPointeur.value.lerp(pointeurLocal, 1 - Math.exp(-6 * dt));
    if (lueur) lueur.style.opacity = u.uOpacite.value.toFixed(3);

    rendu.render(scene, camera);
  }

  raf = requestAnimationFrame(image);
  return () => cancelAnimationFrame(raf);
}
