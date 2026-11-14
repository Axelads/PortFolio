// Contenu de la vidéo — repris de frontend/src/assets/Data/DataCvContent.json et DataSkills.json
// (VS Code retiré : 36 compétences pour les 36 points de l'anneau du logo), et de la fiche store de Lunello.
window.DONNEES = {
  identite: {
    prenom: 'Axel',
    nom: 'Grégoire',
    titre: 'Développeur Full Stack JavaScript',
    sousTitre: 'Web · Mobile · Automatisation IA',
    lieu: 'Freelance — Rougiers (Var) · à distance',
    site: 'axelgregoire.fr',
    email: 'contact@axelgregoire.fr',
    linkedin: 'linkedin.com/in/axel-gregoire',
    github: 'github.com/Axelads',
  },

  // Les arrêts du chapitre « avant le code »
  avant: [
    { annee: 2008, societe: 'Crédit du Nord', role: "Chargé d'accueil — alternance BTS Banque", lieu: 'Manosque', puce: 'Ouverture d’une agence, accueil et suivi des projets clients.' },
    { annee: 2010, societe: 'SunWater', role: 'Commercial & formateur', lieu: 'Var · Occitanie', puce: 'Prospection terrain, formation d’une équipe commerciale.' },
    { annee: 2012, societe: 'ACEH', role: 'Commercial', lieu: 'Occitanie', puce: 'Comprendre le problème du client avant de vendre la solution.' },
    { annee: 2013, societe: 'Olive et Compagnie', role: 'Gérant de SARL', lieu: 'Var · Bouches-du-Rhône · Vaucluse · Gard', puce: 'Dix ans de marchés : stocks, personnel, comptabilité, clientèle fidèle.' },
  ],

  // 36 compétences, dans l'ordre des catégories : chaque catégorie hérite d'un arc contigu de l'arc-en-ciel du logo
  categories: [
    { nom: 'Langages', items: ['JavaScript', 'HTML5', 'CSS3'] },
    { nom: 'Frameworks', items: ['React', 'Node.js', 'Next.js', 'Express'] },
    { nom: 'Mobile', items: ['React Native', 'Expo · EAS', 'Reanimated', 'Skia', 'ML Kit', 'Android Studio'] },
    { nom: 'Styles & UI', items: ['SASS / SCSS', 'TipTap', 'Three.js · R3F'] },
    { nom: 'Animation', items: ['GSAP', 'Lottie', 'Lenis'] },
    { nom: 'Données', items: ['PocketBase', 'MongoDB', 'Mongoose', 'SQLite'] },
    { nom: 'Outils & DevOps', items: ['Git / GitHub', 'Vercel · Koyeb', 'Puppeteer · Playwright', 'SEO technique', 'DNS & SSL', 'Docker'] },
    { nom: 'IA & Automatisation', items: ['SDK Anthropic', 'Bots Telegram · Discord', 'Scraping'] },
    { nom: 'API & Services', items: ['REST API', 'Auth JWT · OAuth', 'Stripe · Stancer', 'E-mails transactionnels'] },
  ],
  heros: ['JavaScript', 'React', 'Node.js', 'React Native', 'PocketBase', 'SDK Anthropic'],

  lunello: {
    fonctions: [
      { texte: 'Routines du matin et du soir', couleur: '#8FC9F0' },
      { texte: '45 histoires du soir, lues à voix haute', couleur: '#C9B5E8' },
      { texte: '29 jeux, à l’écran et en vrai', couleur: '#F7A76C' },
      { texte: 'Émotions, souvenirs, pense-bête', couleur: '#A8E0C8' },
    ],
    stack: ['React Native', 'Expo · EAS', 'Reanimated', 'PocketBase', 'Achats intégrés', 'Notifications', 'Hors ligne'],
    ecrans: ['01-accueil', '03-histoires', '04-jeux', '05-emotions', '07-souvenirs', '08-semaine'],
  },

  projets: [
    { nom: 'ColiPerforma', logo: 'coliperforma.png', accent: '#FE8E26', texte: 'App métier pour préparateurs de commandes : lecture de texte ML Kit, codes-barres, productivité.', stack: ['React Native', 'ML Kit', 'PocketBase'] },
    { nom: 'BreakCrew', logo: 'breakcrew.png', accent: '#27798D', texte: 'App ciné entre collègues : groupes, bibliothèque, filtre anti-frustration et Ciné-Roulette.', stack: ['React Native', 'Expo', 'TMDB'] },
    { nom: 'HydraTrack', logo: 'hydratrack.png', accent: '#4AA8F0', texte: 'Suivi d’hydratation : rendu Skia, SQLite local, notifications, capteurs du téléphone.', stack: ['React Native', 'Skia', 'SQLite'] },
    { nom: 'saveurs-du-marche.fr', logo: 'saveurs.png', accent: '#3E8E6A', texte: 'Boutique d’épices du stand familial : paiement Stancer, Mondial Relay, admin PocketBase.', stack: ['Next.js', 'PocketBase', 'Stancer'] },
    { nom: 'Vigie', logo: 'vigie.svg', accent: '#5F7EA1', texte: 'Audit de sécurité d’un dépôt GitHub ou d’un .apk / .ipa, en conteneurs jetables, analyse IA.', stack: ['FastAPI', 'Docker', 'Claude'] },
    { nom: 'Boutique de jeux', logo: 'boutiquejeux.svg', accent: '#C7A24B', texte: 'Boutique en scènes 3D temps réel, éditeur d’administration riche, e-mails transactionnels.', stack: ['Next.js', 'R3F', 'GSAP'] },
    { nom: 'RolistesUnis.fr', logo: 'rolistesunis.png', accent: '#E7CB89', texte: 'Site de l’association RUNE conçu comme un point & click : la page s’explore comme une scène.', stack: ['React', 'GSAP', 'SEO'] },
    { nom: 'Bots & agents', logo: 'bots.png', accent: '#F4A261', texte: 'Bot Discord, bots Telegram de veille, agents Claude planifiés : ce portfolio publie seul son blog.', stack: ['Node.js', 'Telegram', 'SDK Anthropic'] },
  ],

  forces: [
    { titre: 'Relation client', nombre: 15, unite: 'ans', texte: 'face au client, des marchés de Provence aux projets web.' },
    { titre: "Culture d'entreprise", nombre: 10, unite: 'ans', texte: 'à diriger une entreprise : budgets, délais, décisions assumées.' },
    { titre: 'Autonomie produit', nombre: 0, unite: 'intermédiaire', texte: 'de la maquette à la mise en ligne.' },
  ],

  citation: [
    'Dix ans à diriger une entreprise m’ont appris',
    'à livrer ce que le client attend.',
    'Le code m’a donné les moyens de le construire.',
  ],
};
