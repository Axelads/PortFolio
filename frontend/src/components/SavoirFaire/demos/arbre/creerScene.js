import * as THREE from "three";
import { construireGeometrie } from "./geometrie";
import { fragmentShader, vertexShader } from "./shaders";

/** Rendu WebGL, caméra et nuage de particules. Renvoie null sans WebGL. */
export function creerScene(hote, { nombre, petit, largeurVoulue, reculMin }) {
  let rendu;
  try {
    rendu = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  const ratio = Math.min(window.devicePixelRatio || 1, petit ? 1.5 : 2);
  rendu.setPixelRatio(ratio);
  rendu.setClearColor(0x000000, 0);
  rendu.domElement.style.cssText = "display:block;width:100%;height:100%";
  hote.appendChild(rendu.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  const uniforms = {
    uTemps: { value: 0 },
    uSouffle: { value: 0.5 },
    uEclat: { value: 0 },
    uOndes: { value: 0 },
    uOndule: { value: 0 },
    uRotation: { value: 0 },
    uPointeur: { value: new THREE.Vector3(50, 50, 50) },
    uTaille: { value: petit ? 70 : 64 },
    uRatio: { value: ratio },
    uOpacite: { value: 0 },
  };
  const geometrie = construireGeometrie(nombre);
  const materiau = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometrie, materiau);
  points.frustumCulled = false;
  scene.add(points);

  // Recule la caméra pour que l'arbre tienne aussi en largeur sur mobile.
  function dimensionner() {
    const l = hote.clientWidth || window.innerWidth;
    const h = hote.clientHeight || window.innerHeight;
    rendu.setSize(l, h, false);
    camera.aspect = l / h;
    const tanDemi = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.z = Math.max(reculMin, largeurVoulue / (2 * tanDemi * camera.aspect));
    camera.updateProjectionMatrix();
  }

  function detruire() {
    geometrie.dispose();
    materiau.dispose();
    rendu.dispose();
    rendu.domElement.remove();
  }

  dimensionner();
  return { rendu, scene, camera, points, uniforms, dimensionner, detruire };
}
