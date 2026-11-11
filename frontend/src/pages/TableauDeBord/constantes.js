// Tableau de bord privé : route non liée depuis le site, absente du sitemap, « noindex ».
// La sécurité ne repose pas sur ce chemin (lisible dans le JavaScript public) mais sur l'API :
// mot de passe + code reçu par e-mail, session vérifiée côté serveur à chaque requête.
export const ROUTE_TABLEAU_DE_BORD = '/projet-ensemble-protege';

// Aucune donnée ni aucun secret ici : uniquement l'adresse de l'API, qui refuse tout sans session.
export const URL_API_TABLEAU_DE_BORD = process.env.REACT_APP_API_TABLEAU_DE_BORD || 'https://api.axelgregoire.fr';
