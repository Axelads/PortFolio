import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const doux = gsap.parseEase("power2.inOut");
const lin = gsap.parseEase("power1.inOut");

/**
 * Scénario de l'accueil : le hero fait éclater l'arbre de vie, le manifeste
 * recompose les particules en anneaux, la sonothérapie les fait vibrer,
 * l'aube les efface. Le scroll fixe des cibles, l'image les rejoint en douceur.
 */
export function suivreScrollAccueil(cible, { retard = 0 } = {}) {
  // « retard » : part du défilement du hero pendant laquelle l'arbre reste intact.
  const apresRetard = (p) => Math.max(0, (p - retard) / (1 - retard));
  const etapes = [
    ["hero", "top top", "bottom top", (p) => (cible.eclat = doux(apresRetard(p)))],
    [
      "manifeste",
      "top top",
      "bottom bottom",
      (p) => {
        cible.eclat = 1 - 0.75 * lin(p);
        cible.ondes = doux(Math.min(1, p * 1.25));
      },
    ],
    ["sonotherapie", "top bottom", "center center", (p) => (cible.ondule = p)],
    [
      "aube",
      "top bottom",
      "top 15%",
      (p) => {
        cible.opacite = 1 - p;
        cible.decalageY = p * 1.4;
      },
    ],
  ];

  return etapes
    .filter(([id]) => document.getElementById(id))
    .map(([id, start, end, appliquer]) =>
      ScrollTrigger.create({
        trigger: document.getElementById(id),
        start,
        end,
        onUpdate: (st) => appliquer(st.progress),
        onLeaveBack: id === "manifeste" ? () => (cible.ondes = 0) : undefined,
      }),
    );
}
