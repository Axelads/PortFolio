// Shaders des étincelles. La position de chaque étincelle se calcule à partir du temps :
// aucune mémoire d'une image à l'autre, donc remonter la page rembobine le feu.

export const sommet = /* glsl */ `
uniform float uTemps;
uniform float uTempsFeu; // temps des bombes et des fusées : il continue quand la phrase attend (demarrer.js)
uniform float uTempsReel;
uniform float uDefilement;
uniform vec2 uEcran;
uniform float uEchellePoint;

attribute vec3 aDepart;
attribute vec3 aVitesse;
attribute vec4 aTemps;     // naissance, vie, lumière, graine
attribute vec4 aPhysique;  // frein, gravité, taille, type (0 étincelle, 1 fusée, 2 texte)
attribute vec3 aCouleur;
attribute vec3 aCouleurFin; // couleur de fin de vie : l'étoile vire, comme les bombes à changement de couleur
attribute vec4 aCible;     // x écran, y document, début et fin de la convergence
attribute float aLiberation;

varying vec3 vCouleur;
varying float vAlpha;

vec3 trajectoire(vec3 depart, vec3 vitesse, float frein, float gravite, float age) {
  float amorti = (1.0 - exp(-frein * age)) / frein;
  return depart + vitesse * amorti + vec3(0.0, -gravite, 0.0) * (age - amorti) / frein;
}

void main() {
  float type = aPhysique.w;
  float age = (type < 1.5 ? uTempsFeu : uTemps) - aTemps.x;
  if (age < 0.0 || age > aTemps.y) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vAlpha = 0.0;
    return;
  }

  vec3 p;
  float alpha = 1.0;

  if (type < 0.5) {
    p = trajectoire(aDepart, aVitesse, aPhysique.x, aPhysique.y, age);
    alpha = 1.0 - smoothstep(0.45 * aTemps.y, aTemps.y, age);
  } else if (type < 1.5) {
    float t = clamp(age / aTemps.y, 0.0, 1.0);
    float avance = 1.0 - pow(1.0 - t, 2.2);
    p = mix(aDepart, aVitesse, avance);
    p.x += sin(t * 9.0 + aTemps.w * 6.28) * 2.0 * (1.0 - t);
  } else {
    // type 3 : texte écrit en feu, fixé à l'écran ; type 2 : titre de la page, qui suit le défilement.
    bool feu = type > 2.5;
    float defile = feu ? 0.0 : uDefilement;
    vec3 cible = vec3(aCible.x - uEcran.x * 0.5, uEcran.y * 0.5 - (aCible.y - defile), 0.0);
    vec3 eclat = trajectoire(aDepart, aVitesse, aPhysique.x, aPhysique.y, age);
    float m = smoothstep(aCible.z, aCible.w, uTemps);
    p = mix(eclat, cible, m * m * (3.0 - 2.0 * m));
    float pose = smoothstep(aCible.w - 0.1, aCible.w + 0.5, uTemps) * (1.0 - smoothstep(aLiberation - 0.5, aLiberation - 0.1, uTemps));
    if (feu) {
      // Les lettres vivent : légère vibration et scintillement, comme des étincelles posées.
      float g = aTemps.w * 40.0;
      p.xy += vec2(sin(uTempsReel * 1.7 + g), cos(uTempsReel * 1.3 + g * 1.3)) * 0.8 * m;
      alpha = 1.0 - pose * (0.12 + 0.12 * sin(uTempsReel * 6.0 + g));
    } else {
      alpha = 1.0 - pose * 0.94;
    }
    if (uTemps > aLiberation) {
      float chute = uTemps - aLiberation;
      p = trajectoire(cible, vec3(aVitesse.x * 0.08, 18.0, 0.0), 1.2, 55.0, chute);
      alpha = 1.0 - smoothstep(0.6, 2.4, chute);
    }
  }

  float graine = aTemps.w;
  float crepite = step(0.25, fract(sin(graine * 91.7 + floor(uTempsReel * 24.0) * 3.1) * 43758.5));
  alpha *= mix(1.0, crepite, step(0.72, graine) * step(type, 0.5));
  alpha *= aTemps.z;

  float chaleur = (1.0 - smoothstep(0.0, 0.26, age)) * step(type, 0.5);
  float vire = smoothstep(0.36 * aTemps.y, 0.52 * aTemps.y, age) * step(type, 0.5);
  vCouleur = mix(mix(aCouleur, aCouleurFin, vire), vec3(1.0, 0.96, 0.86), chaleur);
  vAlpha = alpha;

  vec4 vue = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * vue;
  gl_PointSize = aPhysique.z * 3.4 * uEchellePoint / -vue.z;
}
`;

// Chaque étincelle : un cœur blanc-chaud serré et un halo coloré, additionnés à l'écran.
export const fragment = /* glsl */ `
varying vec3 vCouleur;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float coeur = exp(-d * d * 12.0);
  float halo = exp(-d * d * 3.0) * 0.42;
  float a = (coeur + halo) * vAlpha;
  vec3 couleur = mix(vCouleur, vec3(1.0, 0.97, 0.9), coeur * 0.45);
  gl_FragColor = vec4(couleur * a * 1.5, a);
}
`;
