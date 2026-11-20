import { creerScene } from "./creerScene";
import { creerHorloge } from "./horloge";
import { suivrePointeur } from "./suivrePointeur";
import { suivreScrollAccueil } from "./suivreScroll";
import { lancerBoucle } from "./boucle";

// Sur mobile, l'arbre se tient derrière les titres du hero : son centre suit le milieu du bloc
// de titres, sans jamais remonter sous l'en-tête.
const DEMI_HAUTEUR_ARBRE = 1.72; // en unités de scène
const HAUT_MINIMAL = 92; // en pixels : le feuillage commence sous l'en-tête

function centreDesTitres() {
  const titres = document.querySelector("#hero h1");
  if (!titres) return null;
  const { top, height } = titres.getBoundingClientRect();
  return top + window.scrollY + height / 2;
}

/**
 * Monte l'arbre de vie dans son hôte et renvoie la fonction qui le démonte.
 * Ce module tire three.js : Souffle3D le charge à part, une fois la page
 * affichée, pour ne pas retarder le premier écran.
 */
export function monterSouffle({ hote, lueur, variante }) {
  const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const petit = window.matchMedia("(max-width: 767px)").matches;
  const accueil = variante === "accueil";
  const scene3d = creerScene(hote, {
    nombre: accueil ? (petit ? 5200 : 14000) : petit ? 2600 : 6500,
    petit,
    largeurVoulue: accueil ? 4.6 : 4.2,
    reculMin: accueil ? 9 : 8,
  });
  if (!scene3d) return () => {};

  const cible = { eclat: 0, ondes: 0, ondule: 0, opacite: 1, decalageY: 0 };
  const mobile = accueil && petit;
  const decalage = { x: accueil && !petit ? 1.55 : 0, y: accueil && !petit ? 0.1 : 0 };
  const placer = () => {
    scene3d.dimensionner();
    if (!mobile) return;
    const { fov, position } = scene3d.camera;
    const hauteur = hote.clientHeight || window.innerHeight;
    const unitesParPixel = (2 * position.z * Math.tan((fov * Math.PI) / 360)) / hauteur;
    const centre = Math.max(centreDesTitres() ?? hauteur * 0.35, HAUT_MINIMAL + DEMI_HAUTEUR_ARBRE / unitesParPixel);
    decalage.y = (hauteur / 2 - centre) * unitesParPixel;
  };
  placer();
  if (mobile) {
    // L'arbre apparaît directement à sa place, sans glisser depuis le centre de l'écran.
    scene3d.points.position.set(decalage.x, decalage.y, 0);
    // Les titres bougent encore un peu quand les polices arrivent : on recale une fois.
    document.fonts?.ready.then(placer);
  }
  const observateur = new ResizeObserver(placer);
  observateur.observe(hote);

  if (reduit) {
    Object.assign(scene3d.uniforms.uOpacite, { value: 1 });
    scene3d.points.position.set(decalage.x, decalage.y, 0);
    const figer = () => scene3d.rendu.render(scene3d.scene, scene3d.camera);
    figer();
    window.addEventListener("resize", figer);
    return () => {
      window.removeEventListener("resize", figer);
      observateur.disconnect();
      scene3d.detruire();
    };
  }

  let visible = true;
  const vue = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  vue.observe(hote);
  const horloge = creerHorloge();
  const pointeur = suivrePointeur(hote, scene3d.camera);
  const surGuide = (e) => (cible.centre = Boolean(e.detail?.actif));
  window.addEventListener("souffle:guide", surGuide);
  // Sur mobile, l'arbre reste entier au début du défilement : il n'éclate pas au premier geste.
  const declencheurs = accueil ? suivreScrollAccueil(cible, { retard: petit ? 0.3 : 0 }) : [];
  const arreter = lancerBoucle({ scene3d, cible, horloge, pointeur, decalage, lueur, estVisible: () => visible });

  return () => {
    arreter();
    window.removeEventListener("souffle:guide", surGuide);
    declencheurs.forEach((d) => d.kill());
    horloge.detacher();
    pointeur.detacher();
    observateur.disconnect();
    vue.disconnect();
    scene3d.detruire();
  };
}
