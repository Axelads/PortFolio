// Clients du bandeau « Ils m'ont fait confiance » (accueil). Bandeau d'affichage seul : aucune plaque n'est un lien.
// Logos tirés des dossiers de chaque projet (Intermarché : Wikimedia Commons), préparés en WebP 120 px ou SVG.
// `logotype` : le logo contient déjà le nom (Intermarché) ; il prend alors la place du nom écrit.
import harmovita from '../../images/clients/harmovita.webp';
import intermarche from '../../images/clients/intermarche.svg';
import honneure from '../../images/clients/honneure.webp';
import abadias from '../../images/clients/abadias.svg';
import lunello from '../../images/clients/lunello.webp';
import saveurs from '../../images/clients/saveurs-du-marche.webp';
import rune from '../../images/clients/rune.webp';
import cleanProject from '../../images/clients/clean-project.webp';

const CLIENTS = [
  { id: 'harmovita', nom: 'Harmovità', activite: 'Sophrologie et sonothérapie', logo: harmovita },
  { id: 'intermarche', nom: 'Intermarché', activite: 'Grande distribution', logo: intermarche, logotype: true },
  { id: 'honneure', nom: "Honn'Eure", activite: 'Club motard', logo: honneure },
  { id: 'abadias', nom: 'Abadias Artifices', activite: "Feux d'artifice", logo: abadias },
  { id: 'lunello', nom: 'Lunello', activite: 'Application pour les familles', logo: lunello },
  { id: 'saveurs', nom: 'Saveurs du Marché', activite: 'Épices en ligne', logo: saveurs },
  { id: 'rune', nom: 'Rune', activite: 'Rolistes unis', logo: rune },
  { id: 'clean-project', nom: 'Clean-Project', activite: 'Lavage auto à domicile', logo: cleanProject },
];

export default CLIENTS;
