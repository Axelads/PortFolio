import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SceneDemo from './SceneDemo';
import PointClic from './PointClic';

// « Un site pensé pour chaque client » : chaque bloc part du métier d'un client et montre ce que son site fait
// qu'aucun modèle ne ferait, avec le vrai code repris du projet livré.

const chargerFeu = () => import('./demos/feu/monterFeu').then((m) => m.monterFeu);
const chargerArbre = () => import('./demos/arbre/monterArbre').then((m) => m.monterArbre);
const chargerDe = () => import('./demos/de/monterDe').then((m) => m.monterDe);

// La phrase d'Abadias, telle qu'elle s'écrit sur son site.
const PHRASE_ABADIAS = [
  { texte: 'Le ciel,', palette: 'ivoire' },
  { texte: 'écrit pour vous.', palette: 'or' },
];
const LONGUEUR_MAX = 28;

// Coupe la phrase du visiteur en une ou deux lignes équilibrées.
function enLignes(saisie) {
  const texte = saisie.replace(/\s+/g, ' ').trim().slice(0, LONGUEUR_MAX);
  const mots = texte.split(' ');
  if (texte.length <= 12 || mots.length < 2) return [{ texte, palette: 'or' }];
  let coupe = 1;
  let meilleur = Infinity;
  for (let i = 1; i < mots.length; i++) {
    const ecart = Math.abs(mots.slice(0, i).join(' ').length - mots.slice(i).join(' ').length);
    if (ecart < meilleur) {
      meilleur = ecart;
      coupe = i;
    }
  }
  return [
    { texte: mots.slice(0, coupe).join(' '), palette: 'ivoire' },
    { texte: mots.slice(coupe).join(' '), palette: 'or' },
  ];
}

const Technos = ({ liste }) => (
  <ul className="savoir-bloc__technos" aria-label="Technologies">
    {liste.map((t) => <li key={t}>{t}</li>)}
  </ul>
);

const Projet = ({ slug, nom }) => (
  <p className="savoir-bloc__projet">
    <Link to={`/Projet/${encodeURIComponent(slug)}`}>
      Voir le projet {nom}
      <span aria-hidden="true">→</span>
    </Link>
  </p>
);

const BlocFeu = () => {
  const [feu, setFeu] = useState(null);
  const [saisie, setSaisie] = useState('');

  const ecrire = (evenement) => {
    evenement.preventDefault();
    if (!feu || !saisie.trim()) return;
    feu.ecrire(enLignes(saisie));
  };

  return (
    <article className="savoir-bloc" aria-labelledby="savoir-feu">
      <div className="savoir-bloc__demo">
        <SceneDemo
          className="scene-demo--feu"
          charger={chargerFeu}
          options={{ lignes: PHRASE_ABADIAS, police: "'Montserrat', 'Montserrat Fallback', sans-serif" }}
          affiche="/demos/affiche-feu.webp"
          altAffiche="Capture du site d'Abadias Artifices : la phrase « Le ciel, écrit pour vous. » écrite en étincelles"
          etiquette="Feu d'artifice qui écrit une phrase en étincelles dans un ciel de nuit"
          surPret={setFeu}
        >
          <p className="scene-demo__consigne" aria-hidden="true">Cliquez dans le ciel pour tirer une bombe.</p>
        </SceneDemo>
        <form className="savoir-bloc__commandes" onSubmit={ecrire}>
          <label className="savoir-bloc__champ">
            <span>Votre phrase</span>
            <input
              type="text"
              value={saisie}
              maxLength={LONGUEUR_MAX}
              placeholder="Joyeux anniversaire Léa"
              onChange={(e) => setSaisie(e.target.value)}
              autoComplete="off"
            />
          </label>
          <button type="submit" className="savoir-bloc__bouton" disabled={!feu}>L'écrire en feu</button>
          <button type="button" className="savoir-bloc__bouton savoir-bloc__bouton--discret" disabled={!feu} onClick={() => feu?.rejouer()}>
            Rejouer
          </button>
        </form>
      </div>
      <div className="savoir-bloc__texte">
        <h3 id="savoir-feu">Un artificier&nbsp;: son site tire un vrai feu d'artifice</h3>
        <p>
          Abadias Artifices vend de l'émerveillement. Plutôt qu'une vidéo de feu, son site en tire un vrai, en 3D,
          et écrit ses phrases dans le ciel en étincelles.
        </p>
        <p className="savoir-bloc__comment">
          Chaque étincelle est calculée par la carte graphique à partir du seul temps écoulé&nbsp;: rien n'est gardé
          d'une image à l'autre. Les lettres sont relevées dans le texte, puis chaque étincelle vise un pixel du mot.
        </p>
        <Technos liste={['three.js', 'Shaders GLSL', 'Canvas 2D']} />
        <Projet slug="site-abadias-artifices" nom="Abadias Artifices" />
      </div>
    </article>
  );
};

const BlocArbre = () => {
  const lueurRef = useRef(null);
  const [phase, setPhase] = useState(null);

  // L'horloge de l'arbre annonce chaque changement de phase (5 s d'inspiration, 5 s d'expiration).
  useEffect(() => {
    const surPhase = (e) => setPhase(e.detail?.phase ?? null);
    window.addEventListener('souffle:phase', surPhase);
    return () => window.removeEventListener('souffle:phase', surPhase);
  }, []);

  return (
    <article className="savoir-bloc" aria-labelledby="savoir-arbre">
      <div className="savoir-bloc__demo">
        <SceneDemo
          className="scene-demo--arbre"
          charger={chargerArbre}
          options={{ lueur: lueurRef }}
          affiche="/demos/affiche-arbre.webp"
          altAffiche="Capture du site d'Harmovità : un arbre de vie en particules dorées dans un cercle"
          etiquette="Arbre de vie en particules dorées qui respire lentement"
        >
          <div className="scene-demo__lueur" ref={lueurRef} aria-hidden="true" />
          <p className="scene-demo__souffle" data-phase={phase ?? ''} aria-hidden="true">
            {phase === 'expire' ? 'Expirez' : phase === 'inspire' ? 'Inspirez' : ''}
          </p>
        </SceneDemo>
      </div>
      <div className="savoir-bloc__texte">
        <h3 id="savoir-arbre">Une sophrologue&nbsp;: un arbre qui respire avec vous</h3>
        <p>
          Harmovità propose de la sophrologie. Le site ne se contente pas d'en parler, il fait pratiquer&nbsp;: l'arbre
          de vie suit la cohérence cardiaque, cinq secondes d'inspiration, cinq d'expiration, et l'on respire avec lui.
        </p>
        <p className="savoir-bloc__comment">
          Des milliers de particules posées sur un arbre généré&nbsp;; la sève monte des racines aux feuilles à chaque
          inspiration. La souris écarte les feuilles sur son passage. Hors de l'écran, tout s'arrête.
        </p>
        <Technos liste={['three.js', 'Shaders GLSL', 'Bruit procédural']} />
        <Projet slug="site-harmovita" nom="Harmovità" />
      </div>
    </article>
  );
};

const BlocRolistes = () => (
  <article className="savoir-bloc savoir-bloc--large" aria-labelledby="savoir-rolistes">
    <div className="savoir-bloc__demo">
      <PointClic />
    </div>
    <div className="savoir-bloc__texte">
      <h3 id="savoir-rolistes">Une association de rôlistes&nbsp;: un site qui se joue en point &amp; click</h3>
      <p>
        R.U.N.E réunit des joueurs de jeux de rôle. Leur site se visite comme un jeu d'aventure&nbsp;: on entre dans
        l'auberge, on lit le panneau des quêtes, on lance le dé solaire.
      </p>
      <p className="savoir-bloc__comment">
        Des scènes peintes, des zones tracées à la main sur chaque élément du décor, et des repères pour tout faire
        au clavier. Chaque zone mène à une vraie page&nbsp;: événements, actualités, agenda.
      </p>
      <Technos liste={['React', 'SVG', 'Pointer Events']} />
      <Projet slug="RolistesUnis.fr" nom="RolistesUnis" />
    </div>
  </article>
);

const BlocDe = () => (
  <article className="savoir-bloc" aria-labelledby="savoir-de">
    <div className="savoir-bloc__demo">
      <SceneDemo
        className="scene-demo--de"
        charger={chargerDe}
        affiche="/demos/affiche-de.webp"
        altAffiche="Capture de la boutique FantasyMythos : un dé à vingt faces bleu nuit aux arêtes dorées"
        etiquette="Dé à vingt faces en 3D, qu'on peut faire tourner"
      >
        <p className="scene-demo__consigne" aria-hidden="true">Faites-le tourner du doigt ou à la souris.</p>
      </SceneDemo>
    </div>
    <div className="savoir-bloc__texte">
      <h3 id="savoir-de">Une boutique de jeux&nbsp;: un dé à vingt faces en vitrine</h3>
      <p>
        FantasyMythos vend des jeux de rôle et des t-shirts créés à partir de photos. La boutique s'ouvre sur un dé
        dont les faces montrent les créations de l'Atelier&nbsp;: le produit et l'univers dans un seul objet.
      </p>
      <p className="savoir-bloc__comment">
        Un icosaèdre aux arêtes dorées, un cœur lumineux qui respire, et un éclairage de studio calculé au
        chargement, sans image à télécharger. On le fait tourner du doigt&nbsp;; hors de l'écran, il s'arrête.
      </p>
      <Technos liste={['three.js', 'Matériaux physiques', "Éclairage d'environnement"]} />
      <Projet slug="boutique-FantasyMythos" nom="FantasyMythos" />
    </div>
  </article>
);

const SavoirFaire = () => (
  <section className="savoir-faire" id="savoir-faire" aria-labelledby="savoir-faire-titre">
    <header className="savoir-faire__tete">
      <h2 id="savoir-faire-titre">Un site pensé pour chaque client</h2>
      <p>
        Je ne pars pas d'un modèle. Je pars du métier du client et je cherche ce que son site peut faire qu'aucun
        autre ne fait. Quatre exemples, avec leur vrai code&nbsp;: essayez-les.
      </p>
    </header>
    <div className="savoir-faire__blocs">
      <BlocFeu />
      <BlocArbre />
      <BlocRolistes />
      <BlocDe />
    </div>
  </section>
);

export default SavoirFaire;
