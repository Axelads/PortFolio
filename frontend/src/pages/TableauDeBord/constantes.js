// Tableau de bord privé : route non liée depuis le site, absente du sitemap, « noindex ».
// La sécurité ne repose pas sur ce chemin (lisible dans le JavaScript public) mais sur l'API :
// mot de passe + code reçu par e-mail, session vérifiée côté serveur à chaque requête.
export const ROUTE_TABLEAU_DE_BORD = '/projet-ensemble-protege';

// Sous-adresses : la vue d'ensemble à la racine, les pages Sécurité, Signatures et Documents, puis une fiche par projet (slug).
export const CHEMINS = {
  vue: ROUTE_TABLEAU_DE_BORD,
  securite: `${ROUTE_TABLEAU_DE_BORD}/securite`,
  signatures: `${ROUTE_TABLEAU_DE_BORD}/signatures`,
  documents: `${ROUTE_TABLEAU_DE_BORD}/documents`,
  fiche: (slug) => `${ROUTE_TABLEAU_DE_BORD}/${slug}`,
};

/** Vrai pour la racine du tableau de bord et toutes ses sous-adresses. */
export const estRouteTableauDeBord = (chemin) => chemin === ROUTE_TABLEAU_DE_BORD || chemin.startsWith(`${ROUTE_TABLEAU_DE_BORD}/`);

// Aucune donnée ni aucun secret ici : uniquement l'adresse de l'API, qui refuse tout sans session.
export const URL_API_TABLEAU_DE_BORD = process.env.REACT_APP_API_TABLEAU_DE_BORD || 'https://api.axelgregoire.fr';
