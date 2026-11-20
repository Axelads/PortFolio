import { bombes, fusee } from './bombes';
import { choisirCouleur } from './couleurs';

// Cinq façons d'écrire une phrase en feu d'artifice. Chaque lettre est une étincelle de type 3 :
// elle suit sa propre trajectoire puis se pose sur sa cible (en pixels d'écran), y vit, et tombe
// en pluie d'or à la libération.
// c = { ecrivain, hasard, lignes, monde(px, py, z), echelle, quantite, taille, temps, convergence, liberation, depuis, duree }

function lettre(c, o) {
  const chute = c.liberation + c.hasard.entre(0, 0.35);
  c.ecrivain.ajouter({
    type: 3,
    lumiere: 1,
    graine: c.hasard.suivant() * 0.7,
    taille: c.taille,
    frein: o.frein,
    gravite: o.gravite,
    depart: o.depart,
    vitesse: o.vitesse,
    naissance: o.naissance,
    vie: chute + 2.8 - o.naissance,
    couleur: choisirCouleur(o.palette, c.hasard),
    cible: [o.x, o.y, o.debut, o.fin],
    liberation: chute,
  });
}

const tousLesMots = (lignes) => lignes.flatMap((l) => l.mots.map((m) => ({ ...m, palette: l.palette })));

export const ecritures = {
  // Une explosion, et toutes ses étincelles convergent vers les lettres.
  eclat(c) {
    const centre = c.monde(c.depuis[0] * c.ecran.largeur, c.depuis[1] * c.ecran.hauteur, 0);
    for (const m of tousLesMots(c.lignes)) {
      for (const [x, y] of m.points) {
        const d = c.hasard.direction();
        const v = 280 * c.echelle * c.hasard.entre(0.6, 1.1);
        lettre(c, {
          x, y, palette: m.palette, depart: centre, vitesse: [d[0] * v, d[1] * v, d[2] * v * 0.4],
          frein: 1.7, gravite: 60 * c.echelle, naissance: c.temps,
          debut: c.convergence[0] + c.hasard.entre(0, 0.25), fin: c.convergence[1] + c.hasard.entre(0, 0.3),
        });
      }
    }
  },

  // Une lance de feu écrit chaque ligne de gauche à droite et laisse tomber des gouttes d'étincelles.
  balayage(c) {
    const dureeLigne = (c.duree ?? 3) / c.lignes.length;
    c.lignes.forEach((ligne, i) => {
      const debut = c.temps + i * dureeLigne;
      c.ecrivain.ajouter({
        type: 1, depart: c.monde(ligne.x0 - 20, ligne.y), vitesse: c.monde(ligne.x1 + 10, ligne.y),
        naissance: debut, vie: dureeLigne, taille: 3.8, couleur: [1, 0.95, 0.8], frein: 1,
      });
      for (const m of ligne.mots) {
        for (const [x, y] of m.points) {
          const n = debut + ((x - ligne.x0) / Math.max(1, ligne.x1 - ligne.x0)) * dureeLigne;
          lettre(c, {
            x, y, palette: m.palette, depart: c.monde(x + c.hasard.entre(-5, 5), y + c.hasard.entre(-5, 5)),
            vitesse: [c.hasard.entre(-30, 30), c.hasard.entre(20, 80), 0], frein: 4, gravite: 30,
            naissance: n, debut: n + 0.03, fin: n + 0.4,
          });
          if (c.hasard.suivant() < 0.08) {
            c.ecrivain.ajouter({
              depart: c.monde(x, y), vitesse: [c.hasard.entre(-60, 60), c.hasard.entre(-10, 70), 0],
              naissance: n, vie: c.hasard.entre(0.6, 1.2), frein: 1.4, gravite: 160, taille: 1.4, lumiere: 0.9,
              couleur: choisirCouleur('or', c.hasard),
            });
          }
        }
      }
    });
  },

  // Une pluie d'étincelles tombe du ciel et remplit les lettres, en vague de gauche à droite.
  cascade(c) {
    const xs = c.lignes.flatMap((l) => [l.x0, l.x1]);
    const gauche = Math.min(...xs);
    const etendue = Math.max(1, Math.max(...xs) - gauche);
    for (const m of tousLesMots(c.lignes)) {
      for (const [x, y] of m.points) {
        const n = c.temps + ((x - gauche) / etendue) * 0.9 + c.hasard.entre(0, 0.35);
        lettre(c, {
          x, y, palette: m.palette,
          depart: c.monde(x + c.hasard.entre(-40, 40), y - c.hasard.entre(260, 620), c.hasard.entre(-150, 0)),
          vitesse: [c.hasard.entre(-20, 20), -c.hasard.entre(30, 110), 0], frein: 0.9, gravite: 110,
          naissance: n, debut: n + 0.1, fin: n + c.hasard.entre(1.0, 1.4),
        });
      }
    }
  },

  // Chaque mot éclot de son propre petit feu, l'un après l'autre.
  mots(c) {
    tousLesMots(c.lignes).forEach((m, j) => {
      const t = c.temps + j * 0.32;
      const centre = c.monde(m.centre[0], m.centre[1], 0);
      bombes.pivoine({ ecrivain: c.ecrivain, hasard: c.hasard, echelle: c.echelle * 0.45, quantite: c.quantite * 0.2, centre, temps: t, palette: m.palette === 'ivoire' ? 'ivoire' : 'or' });
      for (const [x, y] of m.points) {
        const d = c.hasard.direction();
        const v = 150 * c.echelle * c.hasard.entre(0.5, 1.1);
        lettre(c, {
          x, y, palette: m.palette, depart: centre, vitesse: [d[0] * v, d[1] * v, d[2] * v * 0.4],
          frein: 2, gravite: 40, naissance: t, debut: t + 0.15 + c.hasard.entre(0, 0.15), fin: t + 1.0 + c.hasard.entre(0, 0.25),
        });
      }
    });
  },

  // Des comètes traversent le ciel depuis les bords et déposent chaque mot à sa place.
  cometes(c) {
    tousLesMots(c.lignes).forEach((m, j) => {
      const arrivee = c.temps + j * 0.45 + 0.9;
      const depuisGauche = m.centre[0] < c.ecran.largeur / 2;
      const source = [depuisGauche ? -40 : c.ecran.largeur + 40, c.ecran.hauteur * c.hasard.entre(0.55, 0.95)];
      const centre = c.monde(m.centre[0], m.centre[1], 0);
      fusee({ ecrivain: c.ecrivain, hasard: c.hasard, quantite: c.quantite, depart: c.monde(source[0], source[1]), arrivee: centre, debut: arrivee - 0.9, fin: arrivee });
      bombes.crepitant({ ecrivain: c.ecrivain, hasard: c.hasard, echelle: c.echelle * 0.5, quantite: c.quantite * 0.15, centre, temps: arrivee });
      for (const [x, y] of m.points) {
        const d = c.hasard.direction();
        const v = 120 * c.echelle * c.hasard.entre(0.5, 1.1);
        lettre(c, {
          x, y, palette: m.palette, depart: centre, vitesse: [d[0] * v, d[1] * v, d[2] * v * 0.4],
          frein: 2, gravite: 40, naissance: arrivee, debut: arrivee + 0.08, fin: arrivee + 0.85 + c.hasard.entre(0, 0.2),
        });
      }
    });
  },
};
