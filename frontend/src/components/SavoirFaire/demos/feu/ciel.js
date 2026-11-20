import * as THREE from 'three';

// Fond d'étoiles lointaines, légèrement décalées au défilement pour donner la profondeur.
export function creerCiel(nombre, hasard) {
  const positions = new Float32Array(nombre * 3);
  for (let i = 0; i < nombre; i++) {
    positions[i * 3] = hasard.entre(-1, 1) * 2600;
    positions[i * 3 + 1] = hasard.entre(-1, 1) * 2200;
    positions[i * 3 + 2] = hasard.entre(-2600, -1400);
  }
  const geometrie = new THREE.BufferGeometry();
  geometrie.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const matiere = new THREE.PointsMaterial({
    color: 0xf4efe6,
    size: 1.6,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const etoiles = new THREE.Points(geometrie, matiere);
  etoiles.frustumCulled = false;
  return etoiles;
}
