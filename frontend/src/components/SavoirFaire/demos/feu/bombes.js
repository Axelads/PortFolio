import { choisirCouleur, couleurDuSecteur } from './couleurs';

// Catalogue des effets. Chaque bombe écrit ses étincelles dans la nuée.
// o = { ecrivain, hasard, centre:[x,y,z], temps, echelle, quantite, palette, paletteFin }
// `paletteFin` : les étoiles virent à cette couleur à mi-vie (bombe à changement de couleur).

// Une traînée = des copies de l'étincelle nées un peu plus tard (`pas` secondes) sur la même trajectoire.
// `regulier` : vitesses presque égales, pour les formes nettes (anneau, cœur). `graineMin` : 0,74 et plus = crépite.
function eclater(o, { nombre, vitesse, frein, gravite, vie, taille, trainees, direction, lumiereTrainee = 0.5, pas = 0.03, regulier = false, graineMin = 0 }) {
  const { ecrivain, hasard, centre, temps, echelle } = o;
  const n = Math.max(12, Math.round(nombre * o.quantite));
  const facteur = (o.facteur ?? 1) * hasard.entre(0.88, 1.12);
  for (let i = 0; i < n; i++) {
    const d = direction ? direction(i, n) : hasard.direction();
    const v = vitesse * echelle * facteur * (regulier ? hasard.entre(0.97, 1.03) : hasard.entre(0.86, 1.12));
    const part = direction ? i / n : undefined;
    const couleur = couleurDuSecteur(o.palette, d, hasard, part);
    const couleurFin = o.paletteFin ? couleurDuSecteur(o.paletteFin, d, hasard, part) : couleur;
    const graine = graineMin + hasard.suivant() * (1 - graineMin);
    const duree = vie * hasard.entre(0.85, 1.15);
    for (let k = 0; k <= trainees; k++) {
      ecrivain.ajouter({
        depart: centre,
        vitesse: [d[0] * v, d[1] * v, d[2] * v * 0.6],
        naissance: temps + k * pas,
        vie: duree,
        lumiere: k === 0 ? 1 : lumiereTrainee * (1 - k / (trainees + 1)),
        graine,
        frein,
        gravite: gravite * echelle,
        taille: taille * (k === 0 ? 1 : Math.max(0.35, 0.85 - (k / trainees) * 0.5)),
        couleur,
        couleurFin,
      });
    }
  }
}

export const bombes = {
  // Saule : longues traînées dorées qui retombent lentement.
  saule: (o) => eclater({ ...o, palette: o.palette ?? 'or' }, { nombre: 260, vitesse: 250, frein: 0.9, gravite: 42, vie: 4.6, taille: 2.2, trainees: 7, pas: 0.05, lumiereTrainee: 0.6 }),
  // Pivoine : sphère nette et brève.
  pivoine: (o) => eclater({ ...o, palette: o.palette ?? 'ivoire' }, { nombre: 280, vitesse: 300, frein: 1.7, gravite: 70, vie: 1.9, taille: 2.4, trainees: 3, pas: 0.022 }),
  // Comète : peu d'étincelles, très longues queues.
  comete: (o) => eclater({ ...o, palette: o.palette ?? 'or' }, {
    nombre: 26, vitesse: 430, frein: 0.6, gravite: 110, vie: 2.2, taille: 3, trainees: 12, pas: 0.018, lumiereTrainee: 0.75,
    direction: (i, n) => {
      const a = -Math.PI * 0.05 + (Math.PI * 1.1 * i) / n;
      return [Math.cos(a), Math.sin(a) * 0.9 + 0.1, (i % 3) * 0.2 - 0.2];
    },
  }),
  // Anneau : un cercle d'étincelles dans un plan incliné au hasard.
  anneau: (o) => {
    const ax = o.hasard.entre(-1.1, 1.1);
    const ay = o.hasard.entre(-0.7, 0.7);
    eclater({ ...o, palette: o.palette ?? 'or' }, {
      nombre: 150, vitesse: 300, frein: 1.5, gravite: 45, vie: 2.1, taille: 2.4, trainees: 3, pas: 0.025, regulier: true,
      direction: (i, n) => {
        const t = (i / n) * Math.PI * 2;
        const x = Math.cos(t);
        const y = Math.sin(t) * Math.cos(ax);
        const z = Math.sin(t) * Math.sin(ax);
        return [x * Math.cos(ay) + z * Math.sin(ay), y, -x * Math.sin(ay) + z * Math.cos(ay)];
      },
    });
  },
  // Palmier : une dizaine de grosses comètes en éventail qui retombent comme des palmes.
  palmier: (o) => eclater({ ...o, palette: o.palette ?? 'or', quantite: Math.max(1, o.quantite) }, {
    nombre: 11, vitesse: 360, frein: 0.75, gravite: 160, vie: 2.8, taille: 3.4, trainees: 16, pas: 0.03, lumiereTrainee: 0.8,
    direction: (i, n) => {
      const a = Math.PI * (0.08 + (0.84 * i) / (n - 1));
      return [Math.cos(a), Math.sin(a), ((i % 3) - 1) * 0.25];
    },
  }),
  // Crépitant : une gerbe argentée qui scintille comme de la grenaille.
  crepitant: (o) => eclater({ ...o, palette: o.palette ?? 'argent' }, {
    nombre: 380, vitesse: 210, frein: 2.3, gravite: 45, vie: 1.7, taille: 1.5, trainees: 0, graineMin: 0.74,
  }),
  // Cœur : les étincelles dessinent un cœur, pour les mariages.
  coeur: (o) => eclater({ ...o, palette: o.palette ?? 'rose' }, {
    nombre: 200, vitesse: 17, frein: 1.6, gravite: 16, vie: 2.4, taille: 2.4, trainees: 2, pas: 0.03, regulier: true,
    direction: (i, n) => {
      const t = (i / n) * Math.PI * 2;
      return [16 * Math.sin(t) ** 3, 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t), 0];
    },
  }),
  // Bouquet : trois pivoines serrées, pour les communes.
  bouquet: (o) => {
    [[-110, 20], [0, 70], [110, 10]].forEach(([dx, dy], i) => {
      const centre = [o.centre[0] + dx * o.echelle, o.centre[1] + dy * o.echelle, o.centre[2]];
      bombes.pivoine({ ...o, centre, temps: o.temps + i * 0.22, palette: o.palette ?? 'tricolore', quantite: o.quantite * 0.7 });
    });
  },
};

// Fusée : une tête lumineuse qui monte, et la gerbe qu'elle laisse derrière elle.
export function fusee(o) {
  const { ecrivain, hasard, depart, arrivee, debut, fin, quantite } = o;
  ecrivain.ajouter({ depart, vitesse: arrivee, naissance: debut, vie: fin - debut, type: 1, taille: 3.4, couleur: [1, 0.9, 0.7], frein: 1 });
  const n = Math.round(46 * Math.max(0.5, quantite));
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const avance = 1 - (1 - t) ** 2.2;
    const position = depart.map((v, k) => v + (arrivee[k] - v) * avance);
    ecrivain.ajouter({
      depart: position,
      vitesse: [hasard.entre(-22, 22), hasard.entre(-40, -8), 0],
      naissance: debut + t * (fin - debut),
      vie: hasard.entre(0.45, 0.9),
      frein: 2,
      gravite: 60,
      taille: 1.7,
      lumiere: 0.75,
      couleur: choisirCouleur('or', hasard),
    });
  }
}
