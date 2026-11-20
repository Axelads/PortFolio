import * as THREE from 'three';
import { fragment, sommet } from './shaders';

// Une nuée = un lot d'étincelles dessiné en un seul appel au GPU.
const ATTRIBUTS = { aDepart: 3, aVitesse: 3, aTemps: 4, aPhysique: 4, aCouleur: 3, aCouleurFin: 3, aCible: 4, aLiberation: 1 };

export function creerNuee(capacite) {
  const geometrie = new THREE.BufferGeometry();
  const tampons = {};
  for (const [nom, taille] of Object.entries(ATTRIBUTS)) {
    tampons[nom] = new Float32Array(capacite * taille);
    geometrie.setAttribute(nom, new THREE.BufferAttribute(tampons[nom], taille));
  }
  geometrie.setAttribute('position', new THREE.BufferAttribute(new Float32Array(capacite * 3), 3));
  geometrie.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e7);
  geometrie.setDrawRange(0, 0);

  const matiere = new THREE.ShaderMaterial({
    uniforms: {
      uTemps: { value: 0 },
      uTempsFeu: { value: 0 },
      uTempsReel: { value: 0 },
      uDefilement: { value: 0 },
      uEcran: { value: new THREE.Vector2(1, 1) },
      uEchellePoint: { value: 1 },
    },
    vertexShader: sommet,
    fragmentShader: fragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometrie, matiere);
  points.frustumCulled = false;
  return { points, tampons, geometrie, matiere, capacite };
}

// L'écrivain remplit la nuée étincelle par étincelle. En mode « anneau », il recommence
// au début quand la nuée est pleine (feux tirés au survol).
export function creerEcrivain(nuee, { anneau = false } = {}) {
  let n = 0;
  let total = 0;
  const t = nuee.tampons;
  const poser = (tampon, taille, i, valeurs) => {
    for (let k = 0; k < taille; k++) tampon[i * taille + k] = valeurs[k] ?? 0;
  };
  return {
    ajouter(e) {
      if (n >= nuee.capacite) {
        if (!anneau) return false;
        n = 0;
      }
      const i = n++;
      total = Math.max(total, n);
      poser(t.aDepart, 3, i, e.depart);
      poser(t.aVitesse, 3, i, e.vitesse);
      poser(t.aTemps, 4, i, [e.naissance, e.vie, e.lumiere ?? 1, e.graine ?? Math.random()]);
      poser(t.aPhysique, 4, i, [e.frein ?? 1, e.gravite ?? 0, e.taille ?? 2, e.type ?? 0]);
      poser(t.aCouleur, 3, i, e.couleur);
      // Couleur vers laquelle l'étoile vire en fin de vie (bombes à changement de couleur) ; sinon la même.
      poser(t.aCouleurFin, 3, i, e.couleurFin ?? e.couleur);
      poser(t.aCible, 4, i, e.cible ?? [0, 0, 0, 0]);
      t.aLiberation[i] = e.liberation ?? 0;
      return true;
    },
    reinitialiser() {
      n = 0;
      total = 0;
    },
    terminer() {
      for (const nom of Object.keys(ATTRIBUTS)) nuee.geometrie.getAttribute(nom).needsUpdate = true;
      nuee.geometrie.setDrawRange(0, total);
    },
  };
}
