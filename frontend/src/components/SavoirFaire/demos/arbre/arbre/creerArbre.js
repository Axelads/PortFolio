import { creerHasard } from "./hasard";
import { construireSquelette } from "./squelette";
import { creerParties } from "./parties";
import { cumuler, choisir } from "./tirage";

/** Part des particules donnée à chaque partie de l'arbre. */
const PARTIES = [
  ["feuillage", 0.54],
  ["branches", 0.18],
  ["tronc", 0.09],
  ["racines", 0.12],
  ["cercle", 0.07],
];

/**
 * Arbre de vie : un squelette fixe (même graine à chaque visite) et un
 * tireur qui pose chaque particule sur l'une de ses parties.
 */
export function creerArbre() {
  const parties = creerParties(construireSquelette(creerHasard(11)));
  const cumuls = cumuler(PARTIES.map(([, p]) => p));
  return () => {
    const partie = PARTIES[choisir(cumuls)][0];
    return { partie, ...parties[partie]() };
  };
}
