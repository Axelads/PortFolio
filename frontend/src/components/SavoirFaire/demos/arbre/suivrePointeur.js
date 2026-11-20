import * as THREE from "three";

/** Projette la souris sur le plan z = 0 de la scène. Souris uniquement. */
export function suivrePointeur(hote, camera) {
  const position = new THREE.Vector3(50, 50, 50);
  if (window.matchMedia("(pointer: coarse)").matches) return { position, detacher: () => {} };

  const ndc = new THREE.Vector2();
  const rayon = new THREE.Raycaster();
  const plan = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

  const surPointeur = (e) => {
    const r = hote.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    rayon.setFromCamera(ndc, camera);
    rayon.ray.intersectPlane(plan, position);
  };
  window.addEventListener("pointermove", surPointeur, { passive: true });
  return { position, detacher: () => window.removeEventListener("pointermove", surPointeur) };
}
