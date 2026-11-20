// Couleurs des étincelles (RVB de 0 à 1). L'or, l'ivoire et la braise viennent de la palette Nuit d'or ;
// le rouge, le vert, le bleu, le violet et le cyan sont les couleurs des vraies compositions pyrotechniques.
export const couleurs = {
  or: [1.0, 0.7, 0.26],
  orPale: [1.0, 0.86, 0.56],
  ivoire: [1.0, 0.94, 0.86],
  braise: [1.0, 0.4, 0.18],
  rose: [1.0, 0.56, 0.52],
  argent: [0.86, 0.9, 1.0],
  bleu: [0.38, 0.56, 1.0],
  rouge: [1.0, 0.22, 0.18],
  vert: [0.36, 1.0, 0.4],
  vertPale: [0.72, 1.0, 0.62],
  violet: [0.74, 0.4, 1.0],
  cyan: [0.36, 0.9, 1.0],
};

export const palettes = {
  or: ['or', 'or', 'orPale'],
  ivoire: ['ivoire', 'orPale', 'argent'],
  rose: ['rose', 'orPale', 'braise'],
  tricolore: ['bleu', 'ivoire', 'rouge'],
  braise: ['braise', 'or', 'orPale'],
  argent: ['argent', 'argent', 'ivoire'],
  rouge: ['rouge', 'rouge', 'braise'],
  vert: ['vert', 'vert', 'vertPale'],
  bleu: ['bleu', 'bleu', 'cyan'],
  violet: ['violet', 'violet', 'rose'],
  cyan: ['cyan', 'cyan', 'argent'],
  // Multicolore : chaque part de la bombe a sa couleur, comme une pivoine à secteurs (voir couleurDuSecteur).
  multicolore: ['rouge', 'or', 'vert', 'cyan', 'bleu', 'violet'],
};

function nuancer(base, hasard) {
  const nuance = hasard.entre(0.9, 1.05);
  return base.map((v) => Math.min(1, v * nuance));
}

export function choisirCouleur(palette, hasard) {
  const noms = palettes[palette] ?? palettes.or;
  return nuancer(couleurs[noms[Math.floor(hasard.suivant() * noms.length)]], hasard);
}

// Couleur d'une étincelle selon sa part de la bombe : une bombe « multicolore » éclate en parts
// de couleurs franches au lieu d'un mélange de confettis. Les autres palettes tirent au hasard.
// `part` (0 à 1) : le rang de l'étincelle pour les bombes dessinées (palmier, anneau, cœur), dont l'éventail
// ne couvre pas toujours le cercle ; sinon l'angle de sa direction.
export function couleurDuSecteur(palette, direction, hasard, part) {
  if (palette !== 'multicolore') return choisirCouleur(palette, hasard);
  const noms = palettes.multicolore;
  const fraction = part ?? Math.atan2(direction[1], direction[0]) / (Math.PI * 2) + 0.5;
  return nuancer(couleurs[noms[Math.floor(fraction * noms.length) % noms.length]], hasard);
}
