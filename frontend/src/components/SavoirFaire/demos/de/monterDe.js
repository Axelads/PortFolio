import * as THREE from 'three';
import { lancerBoucle, suivreTaille } from '../commun';

// Dé à 20 faces « mystique » de FantasyMythos (BoutiqueJeux/composants/accueil/De20Mystique3D.js), réécrit en
// three.js simple : la boutique passe par React Three Fiber et drei, le portfolio n'en a pas besoin pour une scène.
// Icosaèdre bleu nuit aux arêtes d'or vieilli, cœur de magie cyan qui pulse, étincelles qui s'élèvent, et six
// médaillons qui montrent des créations de l'Atelier. Ajout pour le portfolio : on le fait tourner au doigt.

const RAYON_DE = 2.1;
const FACES_VITRINES = [1, 4, 7, 10, 14, 17];
const IMAGES = [
  'aaron-sorcier-anime',
  'quentin-contrebandier-stellaire',
  'quentin-netrunner-v4',
  'joshua-icone-low-poly-v4',
  'rodeur-des-tavernes',
  'portrait-low-poly',
].map((nom) => `/demos/de/${nom}.webp`);

const COULEURS_ETINCELLES = ['#C7A24B', '#E3C87E', '#1799C8', '#5FC6E8', '#C7A24B'];
const HAUTEUR_APPARITION = -2.6;
const HAUTEUR_RECYCLAGE = 3.2;

function creerEtincelle(repartie) {
  const angle = Math.random() * Math.PI * 2;
  const rayon = 1.5 + Math.random() * 1.3;
  return {
    x: Math.cos(angle) * rayon,
    z: Math.sin(angle) * rayon * 0.6,
    y: repartie ? HAUTEUR_APPARITION + Math.random() * (HAUTEUR_RECYCLAGE - HAUTEUR_APPARITION) : HAUTEUR_APPARITION,
    vy: 0.25 + Math.random() * 0.35,
    balancement: Math.random() * Math.PI * 2,
    vitesseBalancement: 0.6 + Math.random() * 0.8,
    rot: Math.random() * Math.PI,
    vrot: (Math.random() - 0.5) * 2,
    taille: 0.035 + Math.random() * 0.04,
    couleur: COULEURS_ETINCELLES[(Math.random() * COULEURS_ETINCELLES.length) | 0],
  };
}

// Le studio de lumière de la boutique (quatre Lightformer de drei) : des plaques et un anneau lumineux rendus une
// fois dans une carte d'environnement. Pas d'image HDR à télécharger.
function creerEnvironnement(rendu) {
  const studio = new THREE.Scene();
  const plaque = (couleur, intensite, position, echelle, rotation) => {
    const maille = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(couleur).multiplyScalar(intensite), side: THREE.DoubleSide, toneMapped: false }),
    );
    maille.position.set(...position);
    maille.scale.set(...echelle);
    maille.rotation.set(...rotation);
    studio.add(maille);
  };
  plaque('#e9cf8d', 2.6, [0, 4, 3], [8, 6, 1], [-Math.PI / 6, 0, 0]);
  plaque('#1799C8', 1.8, [-5, 0, 2], [5, 8, 1], [0, Math.PI / 4, 0]);
  plaque('#f4f0e4', 1.5, [5, 1, 3], [5, 6, 1], [0, -Math.PI / 4, 0]);
  const anneau = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 1, 64),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#C7A24B').multiplyScalar(1.6), side: THREE.DoubleSide, toneMapped: false }),
  );
  anneau.position.set(0, -3, 4);
  anneau.scale.setScalar(4);
  anneau.lookAt(0, 0, 0);
  studio.add(anneau);

  const pmrem = new THREE.PMREMGenerator(rendu);
  const cible = pmrem.fromScene(studio, 0, 0.1, 100);
  pmrem.dispose();
  studio.traverse((o) => {
    o.geometry?.dispose();
    o.material?.dispose();
  });
  return cible;
}

// Centre et orientation des faces vitrines (trois sommets consécutifs = une face de l'icosaèdre).
function emplacementsVitrines(geometrie) {
  const position = geometrie.getAttribute('position');
  const versZ = new THREE.Vector3(0, 0, 1);
  return FACES_VITRINES.map((face) => {
    const a = new THREE.Vector3().fromBufferAttribute(position, face * 3);
    const b = new THREE.Vector3().fromBufferAttribute(position, face * 3 + 1);
    const c = new THREE.Vector3().fromBufferAttribute(position, face * 3 + 2);
    const centre = new THREE.Vector3().add(a).add(b).add(c).divideScalar(3);
    const normale = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    if (normale.dot(centre) < 0) normale.negate();
    return {
      position: centre.addScaledVector(normale, 0.02),
      quaternion: new THREE.Quaternion().setFromUnitVectors(versZ, normale),
    };
  });
}

/** Monte le dé dans `hote` et renvoie { detruire }, ou null sans WebGL. */
export function monterDe(hote, { reduit = false } = {}) {
  let rendu;
  try {
    rendu = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  // Réglages par défaut de React Three Fiber, pour garder le rendu de la boutique.
  rendu.toneMapping = THREE.ACESFilmicToneMapping;
  rendu.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  rendu.setClearColor(0x000000, 0);
  rendu.domElement.style.cssText = 'display:block;width:100%;height:100%';
  hote.appendChild(rendu.domElement);

  const scene = new THREE.Scene();
  const environnement = creerEnvironnement(rendu);
  scene.environment = environnement.texture;
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const soleil = new THREE.DirectionalLight('#f6e7c4', 1.4);
  soleil.position.set(4, 6, 6);
  scene.add(soleil);

  const ensemble = new THREE.Group();
  ensemble.position.y = 0.2;
  scene.add(ensemble);
  const pivot = new THREE.Group();
  pivot.rotation.set(0.35, 0.6, 0);
  ensemble.add(pivot);

  const geometrie = new THREE.IcosahedronGeometry(RAYON_DE, 0);
  const aretes = new THREE.EdgesGeometry(geometrie);
  const jetables = [geometrie, aretes];
  const ajouter = (objet) => {
    if (objet.material) jetables.push(objet.material);
    pivot.add(objet);
    return objet;
  };
  ajouter(new THREE.Mesh(geometrie, new THREE.MeshPhysicalMaterial({
    color: '#1C3050', flatShading: true, metalness: 0.45, roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.25,
    envMapIntensity: 1.25, transparent: true, opacity: 0.94,
  })));
  const coeur = ajouter(new THREE.Mesh(geometrie, new THREE.MeshBasicMaterial({ color: '#1799C8', transparent: true, opacity: 0.18 })));
  coeur.scale.setScalar(0.88);
  ajouter(new THREE.LineSegments(aretes, new THREE.LineBasicMaterial({ color: '#C7A24B', transparent: true, opacity: 0.9 })));

  // Médaillons : chaque image est déjà carrée (préparée en 256 px), posée à même sa face.
  const disque = new THREE.CircleGeometry(RAYON_DE * 0.27, 48);
  jetables.push(disque);
  const chargeur = new THREE.TextureLoader();
  emplacementsVitrines(geometrie).forEach((emplacement, i) => {
    const texture = chargeur.load(IMAGES[i % IMAGES.length], () => {
      if (reduit) dessiner();
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    jetables.push(texture);
    const medaillon = ajouter(new THREE.Mesh(disque, new THREE.MeshBasicMaterial({ map: texture, toneMapped: false })));
    medaillon.position.copy(emplacement.position);
    medaillon.quaternion.copy(emplacement.quaternion);
  });

  // Poussière de magie : quatorze octaèdres qui montent en oscillant puis se recyclent.
  const etincelles = reduit ? [] : Array.from({ length: 14 }, () => creerEtincelle(true));
  const groupeEtincelles = new THREE.Group();
  ensemble.add(groupeEtincelles);
  for (const e of etincelles) {
    const g = new THREE.OctahedronGeometry(e.taille, 0);
    const m = new THREE.MeshBasicMaterial({ color: e.couleur, transparent: true, opacity: 0.8 });
    jetables.push(g, m);
    groupeEtincelles.add(new THREE.Mesh(g, m));
  }

  // Cadrage de la boutique (caméra à 9, champ de 40°), reculée si la scène est plus haute que large :
  // la culbute complète doit toujours tenir dans le cadre.
  function dimensionner() {
    const l = hote.clientWidth || 1;
    const h = hote.clientHeight || 1;
    rendu.setSize(l, h, false);
    camera.aspect = l / h;
    const tanDemi = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.set(0, 0, Math.max(9, 3 / (tanDemi * camera.aspect)));
    camera.updateProjectionMatrix();
    if (reduit) dessiner();
  }

  function dessiner() {
    rendu.render(scene, camera);
  }

  // Glisser pour faire tourner : la vitesse donnée par le geste s'amortit ensuite (inertie).
  const elan = { x: 0, y: 0 };
  let glisse = null;
  const surAppui = (e) => {
    glisse = { x: e.clientX, y: e.clientY, id: e.pointerId };
    hote.setPointerCapture?.(e.pointerId);
    hote.dataset.glisse = '1';
  };
  const surMouvement = (e) => {
    if (!glisse || e.pointerId !== glisse.id) return;
    const dx = e.clientX - glisse.x;
    const dy = e.clientY - glisse.y;
    glisse.x = e.clientX;
    glisse.y = e.clientY;
    pivot.rotation.y += dx * 0.012;
    pivot.rotation.x += dy * 0.012;
    elan.y = dx * 0.6;
    elan.x = dy * 0.6;
    if (reduit) dessiner();
  };
  const surFin = () => {
    glisse = null;
    delete hote.dataset.glisse;
  };
  hote.addEventListener('pointerdown', surAppui);
  hote.addEventListener('pointermove', surMouvement);
  hote.addEventListener('pointerup', surFin);
  hote.addEventListener('pointercancel', surFin);

  let temps = 0;
  const arreterBoucle = reduit
    ? () => {}
    : lancerBoucle(hote, (dt) => {
      temps += dt;
      // Culbute « dé qui roule dans le vide » sur deux axes, plus l'élan laissé par le doigt.
      pivot.rotation.y += dt * 0.32 + elan.y * dt;
      pivot.rotation.x += dt * 0.12 + elan.x * dt;
      const frein = Math.exp(-2.4 * dt);
      elan.x *= frein;
      elan.y *= frein;
      pivot.rotation.z = Math.sin(temps * 0.4) * 0.06;
      pivot.position.y = Math.sin(temps * 0.8) * 0.1;
      const pulsation = 0.5 + Math.sin(temps * 1.6) * 0.5;
      coeur.material.opacity = 0.1 + pulsation * 0.22;
      coeur.scale.setScalar(0.86 + pulsation * 0.05);

      etincelles.forEach((e, i) => {
        e.y += e.vy * dt;
        e.balancement += e.vitesseBalancement * dt;
        e.rot += e.vrot * dt;
        if (e.y > HAUTEUR_RECYCLAGE) Object.assign(e, creerEtincelle(false));
        const maille = groupeEtincelles.children[i];
        maille.position.set(e.x + Math.sin(e.balancement) * 0.18, e.y, e.z);
        maille.rotation.set(e.rot, e.rot * 0.7, 0);
        maille.material.opacity = 0.55 + Math.sin(e.balancement * 2) * 0.35;
      });
      dessiner();
    });

  const arreterTaille = suivreTaille(hote, dimensionner);
  dimensionner();
  dessiner();

  return {
    detruire() {
      arreterBoucle();
      arreterTaille();
      hote.removeEventListener('pointerdown', surAppui);
      hote.removeEventListener('pointermove', surMouvement);
      hote.removeEventListener('pointerup', surFin);
      hote.removeEventListener('pointercancel', surFin);
      jetables.forEach((j) => j.dispose());
      environnement.dispose();
      rendu.dispose();
      rendu.domElement.remove();
    },
  };
}
