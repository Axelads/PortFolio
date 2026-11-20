import { bruit } from "./bruit";
import { PIED, FOURCHE, CERCLE } from "./arbre/squelette";

const f = (v) => v.toFixed(3);

export const vertexShader = /* glsl */ `
uniform float uTemps;
uniform float uSouffle;
uniform float uEclat;
uniform float uOndes;
uniform float uOndule;
uniform float uRotation;
uniform vec3 uPointeur;
uniform float uTaille;
uniform float uRatio;
uniform float uOpacite;

attribute vec3 aOnde;
attribute vec4 aAlea;
attribute vec3 aCouleur;
attribute vec4 aArbre; // genre (0 bois, 1 feuillage, 2 cercle), sève, souplesse, taille

varying vec3 vCouleur;
varying float vAlpha;

const vec3 PIED = vec3(0.0, ${f(PIED)}, 0.0);
const vec3 FOURCHE = vec3(0.0, ${f(FOURCHE)}, 0.0);
const vec3 CENTRE_CERCLE = vec3(0.0, ${f(CERCLE.centreY)}, 0.0);

${bruit}

void main() {
  vec3 base = position;
  float feuille = step(0.5, aArbre.x) * step(aArbre.x, 1.5);
  float cercle = step(1.5, aArbre.x);
  vec3 ouvre = normalize(base - FOURCHE + vec3(1e-5));

  // L'arbre respire (5 s / 5 s) : il s'élève depuis son pied, sa couronne s'ouvre.
  vec3 appui = mix(PIED, CENTRE_CERCLE, cercle);
  vec3 arbre = appui + (base - appui) * mix(0.965, 1.035, uSouffle);
  arbre += ouvre * feuille * (uSouffle - 0.5) * 0.14;

  // Le vent berce les rameaux, les feuilles frémissent.
  vec2 vent = vec2(snoise(vec3(base.xy * 0.45, uTemps * 0.11)), snoise(vec3(base.zy * 0.45 + 7.0, uTemps * 0.09)));
  arbre.xz += vent * aArbre.z * 0.08;
  arbre += ouvre * snoise(base * 2.4 + vec3(0.0, uTemps * 0.22, uTemps * 0.1)) * feuille * 0.045;

  // L'arbre tourne lentement sur lui-même ; le cercle reste face au visiteur.
  float ar = uRotation * (1.0 - cercle);
  float c = cos(ar), s = sin(ar);
  arbre.xz = mat2(c, -s, s, c) * arbre.xz;

  // Éclat : chaque particule part vers l'extérieur, en spirale.
  vec3 n = normalize(arbre + vec3(1e-5));
  vec3 dir = normalize(n * 1.25 + (aAlea.xyz - 0.5) * 1.7);
  vec3 eclat = arbre + dir * uEclat * (1.1 + aAlea.w * 3.6);
  float ang = uEclat * (aAlea.x - 0.5) * 2.6;
  float ca = cos(ang), sa = sin(ang);
  eclat.xy = mat2(ca, -sa, sa, ca) * eclat.xy;

  // Ondes sonores : anneaux concentriques qui vibrent comme un bol.
  vec3 onde = aOnde;
  float vague = sin(length(onde.xz) * 5.2 - uTemps * 2.1);
  onde.y += vague * 0.075 * uOndule;
  onde.xz *= 1.0 + vague * 0.014 * uOndule;

  // Recomposition décalée : les particules ne rejoignent pas les anneaux toutes ensemble.
  float t = smoothstep(aAlea.y * 0.4, aAlea.y * 0.4 + 0.6, uOndes);
  vec3 pos = mix(eclat, onde, t);

  // Le pointeur écarte doucement les particules.
  vec3 d = pos - uPointeur;
  pos += normalize(d + vec3(1e-5)) * smoothstep(1.1, 0.0, length(d)) * 0.38 * (1.0 - uEclat * 0.8);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  // La sève monte des racines aux feuilles à l'inspiration, redescend à l'expiration.
  float front = mix(-0.1, 1.1, uSouffle);
  float seve = exp(-pow((aArbre.y - front) / 0.08, 2.0)) * step(0.0, aArbre.y) * (1.0 - uEclat) * (1.0 - t);

  // Profondeur : l'arrière de l'arbre s'éteint, l'avant grossit (volume 3D).
  float avant = smoothstep(-1.9, 1.9, pos.z);
  float forme = mix(aArbre.w, 1.0, t);
  float taille = uTaille * forme * (0.4 + aAlea.w * 0.95) * (0.9 + uSouffle * 0.3) * mix(0.7, 1.25, avant) * (1.0 + seve * 0.7);
  gl_PointSize = taille * uRatio / -mv.z;

  vCouleur = mix(aCouleur, vec3(1.0, 0.92, 0.74), seve * 0.6);
  float scintille = 0.72 + 0.28 * sin(uTemps * (0.8 + aAlea.z * 2.2) + aAlea.x * 6.2831);
  vAlpha = uOpacite * scintille * mix(1.0, 0.55, uEclat * aAlea.w) * mix(0.28, 1.0, avant) * (1.0 + seve * 1.2);
}
`;

export const fragmentShader = /* glsl */ `
varying vec3 vCouleur;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float coeur = smoothstep(0.5, 0.0, d);
  float a = pow(coeur, 2.1);
  if (a < 0.01) discard;
  gl_FragColor = vec4(vCouleur * (0.75 + coeur * 0.55), a * vAlpha);
}
`;
