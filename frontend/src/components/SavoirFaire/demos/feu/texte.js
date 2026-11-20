// Relève les points des lettres d'une phrase, mot par mot, dans une toile 2D cachée de la taille de la scène.
// Version allégée de phrases.js (Abadias) : une phrase de quelques mots, centrée, écrite aussi grand que possible.

// Pixels allumés d'un rectangle de la toile, avec un pas qui grandit jusqu'à tenir le budget (repris d'Abadias).
function relever(ctx, x0, y0, x1, y1, maxPoints) {
  const gauche = Math.max(0, Math.floor(x0));
  const haut = Math.max(0, Math.floor(y0));
  const largeur = Math.max(1, Math.min(ctx.canvas.width, Math.ceil(x1)) - gauche);
  const hauteur = Math.max(1, Math.min(ctx.canvas.height, Math.ceil(y1)) - haut);
  const pixels = ctx.getImageData(gauche, haut, largeur, hauteur).data;
  let pas = 2;
  let points = [];
  do {
    points = [];
    for (let y = 0; y < hauteur; y += pas) {
      for (let x = 0; x < largeur; x += pas) {
        if (pixels[(y * largeur + x) * 4 + 3] > 128) points.push([gauche + x, haut + y]);
      }
    }
    pas += 1;
  } while (points.length > maxPoints && pas < 24);
  return points;
}

const INTERLIGNE = 1.08;

/**
 * `lignes` : [{ texte, palette }]. Renvoie, pour ecritures.js, [{ mots: [{ points, centre }], palette, x0, x1, y }]
 * en pixels de la scène.
 */
export function echantillonnerLignes(lignes, ecran, budget, police) {
  const toile = document.createElement('canvas');
  toile.width = Math.max(1, Math.round(ecran.largeur));
  toile.height = Math.max(1, Math.round(ecran.hauteur));
  const ctx = toile.getContext('2d', { willReadFrequently: true });
  const regler = (taille) => {
    ctx.font = `700 ${taille}px ${police}`;
  };

  // Aussi grand que possible : 60 % de la hauteur pour le bloc, 86 % de la largeur pour la ligne la plus longue.
  let taille = Math.min(160, (ecran.hauteur * 0.6) / (lignes.length * INTERLIGNE));
  regler(taille);
  const plusLongue = Math.max(...lignes.map((l) => ctx.measureText(l.texte).width));
  if (plusLongue > ecran.largeur * 0.86) taille *= (ecran.largeur * 0.86) / plusLongue;
  regler(taille);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';

  const largeurs = lignes.map((l) => ctx.measureText(l.texte).width);
  const total = largeurs.reduce((a, b) => a + b, 0) || 1;
  const premier = ecran.hauteur / 2 - ((lignes.length - 1) * taille * INTERLIGNE) / 2;

  return lignes.map((ligne, i) => {
    const y = premier + i * taille * INTERLIGNE;
    const x0 = (ecran.largeur - largeurs[i]) / 2;
    const mots = [];
    for (const mot of ligne.texte.matchAll(/\S+/g)) {
      const debut = x0 + ctx.measureText(ligne.texte.slice(0, mot.index)).width;
      const w = ctx.measureText(mot[0]).width;
      ctx.clearRect(0, 0, toile.width, toile.height);
      ctx.fillText(mot[0], debut, y);
      const part = Math.max(60, Math.round((budget * w) / total));
      mots.push({
        points: relever(ctx, debut - 6, y - taille, debut + w + 6, y + taille, part),
        centre: [debut + w / 2, y],
      });
    }
    return { mots, palette: ligne.palette, x0, x1: x0 + largeurs[i], y };
  });
}
