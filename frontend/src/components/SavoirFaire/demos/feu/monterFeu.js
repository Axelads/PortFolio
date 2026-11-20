import * as THREE from 'three';
import { bombes, fusee } from './bombes';
import { creerCiel } from './ciel';
import { ecritures } from './ecritures';
import { creerHasard } from './hasard';
import { creerEcrivain, creerNuee } from './nuee';
import { echantillonnerLignes } from './texte';
import { lancerBoucle, suivreTaille } from '../commun';

// Démo du feu d'artifice d'Abadias Artifices dans une scène bornée du portfolio. Le moteur d'origine (nuée,
// shaders, bombes, façons d'écrire) est repris tel quel ; seule la mise en scène change : au lieu du spectacle
// piloté par le défilement de la page, une boucle de tableaux où une phrase s'écrit en feu, chaque fois d'une
// autre façon, et un clic dans la scène tire une bombe à cet endroit.

const MODES = ['eclat', 'mots', 'balayage', 'cometes', 'cascade'];
const DUREE_TABLEAU = 11.5;
const LIBERATION = 6.8;
const TYPES_AU_CLIC = ['pivoine', 'anneau', 'saule', 'crepitant', 'palmier', 'coeur'];
const PALETTES_AU_CLIC = ['or', 'ivoire', 'rose', 'bleu', 'vert', 'violet', 'cyan', 'multicolore'];

// Quand la phrase s'écrit-elle, selon la façon d'écrire.
const DEBUT_ECRITURE = { eclat: 1.0, mots: 0.6, balayage: 0.5, cometes: 0.3, cascade: 0.4 };

function choisirQualite(hote) {
  const modeste = window.matchMedia('(pointer: coarse)').matches || hote.clientWidth < 560 || (navigator.hardwareConcurrency || 4) <= 4;
  return modeste
    ? { quantite: 0.4, pixelsMax: 1.5, points: 2600, capacite: 40000, instants: 5000, taille: 1.0, etoiles: 120 }
    : { quantite: 0.8, pixelsMax: 2, points: 6000, capacite: 90000, instants: 12000, taille: 1.1, etoiles: 240 };
}

/**
 * Monte le feu dans `hote`. `lignes` : [{ texte, palette }] (palettes « ivoire » ou « or »).
 * Renvoie { detruire, rejouer, ecrire } ou null sans WebGL.
 */
export function monterFeu(hote, { lignes, police, reduit = false }) {
  const qualite = choisirQualite(hote);
  let rendu;
  try {
    rendu = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  rendu.setClearColor(0x000000, 0);
  rendu.domElement.style.cssText = 'display:block;width:100%;height:100%';
  hote.appendChild(rendu.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 1, 8000);
  const ciel = creerCiel(qualite.etoiles, creerHasard(7));
  const spectacle = creerNuee(qualite.capacite);
  const instants = creerNuee(qualite.instants);
  scene.add(ciel, spectacle.points, instants.points);
  const ecrivain = creerEcrivain(spectacle);
  const ecrivainInstants = creerEcrivain(instants, { anneau: true });

  const ecran = { largeur: 1, hauteur: 1, distance: 1 };
  let phrase = lignes;
  let tableau = 0;
  let temps = 0; // temps du tableau en cours
  let reel = 0; // temps des bombes tirées au clic
  let pret = false;
  let detruit = false;

  // Pixels de la scène vers le monde 3D (z = 0 : un pixel vaut une unité).
  const monde = (px, py, z = 0) => {
    const facteur = (ecran.distance - z) / ecran.distance;
    return [(px - ecran.largeur / 2) * facteur, (ecran.hauteur / 2 - py) * facteur, z];
  };
  const fraction = ([fx, fy], z = 0) => monde(fx * ecran.largeur, fy * ecran.hauteur, z);
  const echelle = () => Math.min(1.1, Math.max(0.45, Math.min(ecran.largeur / 1440, ecran.hauteur / 900)));

  function ajuster() {
    ecran.largeur = hote.clientWidth || 1;
    ecran.hauteur = hote.clientHeight || 1;
    const ratio = Math.min(window.devicePixelRatio || 1, qualite.pixelsMax);
    rendu.setPixelRatio(ratio);
    rendu.setSize(ecran.largeur, ecran.hauteur, false);
    camera.aspect = ecran.largeur / ecran.hauteur;
    ecran.distance = ecran.hauteur / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    camera.position.set(0, 0, ecran.distance);
    camera.far = ecran.distance + 4000;
    camera.updateProjectionMatrix();
    for (const nuee of [spectacle, instants]) {
      nuee.matiere.uniforms.uEcran.value.set(ecran.largeur, ecran.hauteur);
      nuee.matiere.uniforms.uEchellePoint.value = ecran.distance * ratio;
    }
  }

  // Une bombe précédée de sa fusée, qui monte du bas de la scène.
  function tir(hasard, type, position, t, options = {}) {
    const e = echelle() * (options.echelle ?? 1);
    const commun = { ecrivain: options.ecrivain ?? ecrivain, hasard, echelle: e, quantite: qualite.quantite * (options.quantite ?? 1), palette: options.palette, paletteFin: options.paletteFin };
    fusee({ ...commun, depart: fraction([position[0] + hasard.entre(-0.03, 0.03), 1.05]), arrivee: fraction(position), debut: t - 0.9, fin: t });
    bombes[type]({ ...commun, centre: fraction(position), temps: t });
  }

  // Écrit tout un tableau d'un coup : chaque étincelle connaît son heure, le GPU n'affiche que celles dont l'heure
  // est venue (principe du moteur d'Abadias).
  function construire(mode = MODES[tableau % MODES.length]) {
    const hasard = creerHasard(100 + tableau * 7);
    ecrivain.reinitialiser();
    const debut = DEBUT_ECRITURE[mode];
    if (mode === 'eclat') {
      fusee({ ecrivain, hasard, quantite: qualite.quantite, depart: fraction([0.5, 1.05]), arrivee: fraction([0.5, 0.45]), debut: 0.1, fin: debut });
      bombes.pivoine({ ecrivain, hasard, echelle: echelle() * 0.6, quantite: qualite.quantite * 0.35, centre: fraction([0.5, 0.45]), temps: debut, palette: 'ivoire' });
    }
    ecritures[mode]({
      ecrivain, hasard, ecran,
      echelle: echelle(),
      quantite: qualite.quantite,
      taille: qualite.taille,
      lignes: echantillonnerLignes(phrase, ecran, qualite.points, police),
      monde,
      temps: debut,
      convergence: [debut + 0.15, debut + 1.4],
      liberation: LIBERATION,
      depuis: [0.5, 0.45],
      duree: 2.6,
    });
    // Pendant que la phrase tient : de petits tirs dans les coins hauts, loin des lettres.
    tir(hasard, 'anneau', [0.15, 0.2], 3.1, { quantite: 0.5, echelle: 0.7 });
    tir(hasard, 'comete', [0.85, 0.18], 4.4, { quantite: 0.6, echelle: 0.7 });
    tir(hasard, 'crepitant', [0.2, 0.17], 5.6, { quantite: 0.5, echelle: 0.6 });
    // Après la pluie d'or des lettres : le bouquet.
    tir(hasard, 'pivoine', [0.3, 0.38], 7.0, { palette: 'multicolore' });
    tir(hasard, 'saule', [0.7, 0.32], 7.45);
    tir(hasard, 'palmier', [0.5, 0.48], 8.0);
    tir(hasard, 'anneau', [0.22, 0.3], 8.5, { palette: 'cyan' });
    tir(hasard, 'pivoine', [0.78, 0.36], 8.9, { palette: 'or', paletteFin: 'rouge' });
    ecrivain.terminer();
  }

  function dessiner() {
    const u = spectacle.matiere.uniforms;
    u.uTemps.value = temps;
    u.uTempsFeu.value = temps;
    u.uTempsReel.value = temps;
    const ui = instants.matiere.uniforms;
    ui.uTemps.value = reel;
    ui.uTempsFeu.value = reel;
    ui.uTempsReel.value = reel;
    rendu.render(scene, camera);
  }

  // Mouvement réduit : une seule image, la phrase posée, sans boucle ni tir.
  function figer() {
    construire('eclat');
    temps = 3.6;
    dessiner();
  }

  function rejouer(mode) {
    if (!pret) return;
    temps = 0;
    if (reduit) figer();
    else construire(mode);
  }

  const arreterBoucle = reduit
    ? () => {}
    : lancerBoucle(hote, (dt) => {
      if (!pret) return;
      temps += dt;
      reel += dt;
      if (temps > DUREE_TABLEAU) {
        tableau += 1;
        temps = 0;
        construire();
      }
      dessiner();
    });

  // Un clic dans le ciel tire une bombe à cet endroit (au hasard parmi le catalogue d'Abadias).
  const surClic = (e) => {
    if (reduit || !pret || e.target !== rendu.domElement) return;
    const r = hote.getBoundingClientRect();
    const position = [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
    const hasard = creerHasard((Math.random() * 1e9) | 0);
    const type = TYPES_AU_CLIC[(hasard.suivant() * TYPES_AU_CLIC.length) | 0];
    const palette = type === 'coeur' ? 'rose' : PALETTES_AU_CLIC[(hasard.suivant() * PALETTES_AU_CLIC.length) | 0];
    const e2 = echelle();
    const commun = { ecrivain: ecrivainInstants, hasard, echelle: e2, quantite: qualite.quantite * 0.8, palette };
    fusee({ ...commun, depart: monde(e.clientX - r.left + hasard.entre(-20, 20), ecran.hauteur + 20), arrivee: fraction(position), debut: reel, fin: reel + 0.55 });
    bombes[type]({ ...commun, centre: fraction(position), temps: reel + 0.55 });
    ecrivainInstants.terminer();
  };
  hote.addEventListener('click', surClic);

  const arreterTaille = suivreTaille(hote, () => {
    if (detruit) return;
    ajuster();
    if (pret) rejouer(MODES[tableau % MODES.length]);
  });
  ajuster();

  // La phrase est relevée dans la police du site : on attend qu'elle soit chargée.
  const famille = police.split(',')[0].trim();
  (document.fonts?.load(`700 64px ${famille}`) ?? Promise.resolve()).catch(() => {}).then(() => {
    if (detruit) return;
    pret = true;
    if (reduit) figer();
    else construire();
  });

  return {
    rejouer: () => rejouer(MODES[tableau % MODES.length]),
    ecrire(nouvelles) {
      phrase = nouvelles;
      rejouer('eclat');
    },
    detruire() {
      detruit = true;
      arreterBoucle();
      arreterTaille();
      hote.removeEventListener('click', surClic);
      for (const nuee of [spectacle, instants]) {
        nuee.geometrie.dispose();
        nuee.matiere.dispose();
      }
      ciel.geometry.dispose();
      ciel.material.dispose();
      rendu.dispose();
      rendu.domElement.remove();
    },
  };
}
