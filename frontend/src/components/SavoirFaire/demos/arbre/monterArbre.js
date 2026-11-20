import { monterSouffle } from './monterSouffle';

// L'arbre de vie d'Harmovità (src/components/souffle de Harmotiva), repris tel quel dans sa variante « calme » :
// celle qui respire dans un bandeau de page, sans les effets liés au défilement de l'accueil d'Harmovità.
// `lueur` : le halo derrière l'arbre, dont l'opacité suit l'apparition des particules.
export function monterArbre(hote, { lueur }) {
  const demonter = monterSouffle({ hote, lueur: lueur?.current ?? null, variante: 'calme' });
  // Sans WebGL, monterSouffle ne monte rien et renvoie une fonction vide : la scène reste sur sa capture.
  if (!hote.querySelector('canvas')) return null;
  return { detruire: demonter };
}
