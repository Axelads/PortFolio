// Libellés et mises en forme du tableau de bord (français, fuseau de Paris).

export const TYPES = { mobile: 'Application mobile', web: 'Site web', bot: 'Bot', outil: 'Outil' };
export const FILTRES = [
  { cle: 'tous', libelle: 'Tous', garde: () => true },
  { cle: 'mobile', libelle: 'Mobiles', garde: (p) => p.type === 'mobile' },
  { cle: 'web', libelle: 'Sites', garde: (p) => p.type === 'web' },
  { cle: 'outil', libelle: 'Outils', garde: (p) => p.type === 'outil' || p.type === 'bot' },
];

export const STATUTS = {
  production: { libelle: 'En production', etat: 'en-ligne', ordre: 0 },
  developpement: { libelle: 'En développement', etat: 'accent', ordre: 1 },
  pause: { libelle: 'En pause', etat: 'alerte', ordre: 2 },
  abandonne: { libelle: 'Abandonné', etat: 'inconnu', ordre: 3 },
};

export const CATEGORIES_COMMANDES = {
  developpement: 'Développement',
  build: 'Build',
  deploiement: 'Déploiement',
  'base-de-donnees': 'Base de données',
  maintenance: 'Maintenance',
};

export const ICONES_LIENS = {
  site: 'site',
  store: 'mobile',
  console: 'lien-externe',
  backend: 'serveur',
  code: 'terminal',
  legal: 'bouclier',
  analytics: 'activite',
  design: 'etoile',
};

export const PERIODICITES = { mensuel: '/ mois', annuel: '/ an', ponctuel: 'une fois', usage: '/ mois, à l’usage' };

// Résultat affiché d'un événement du journal : Réussi (vert), Refusé (rouge), Verrouillage (ambre).
export const EVENEMENTS = {
  connexion_reussie: { libelle: 'Connexion réussie', resultat: 'reussi', detail: 'mot de passe et code e-mail' },
  code_envoye: { libelle: 'Code envoyé', resultat: 'reussi', detail: 'code à 8 chiffres par e-mail' },
  mot_de_passe_refuse: { libelle: 'Mot de passe refusé', resultat: 'refuse', detail: 'identifiants invalides' },
  code_refuse: { libelle: 'Code refusé', resultat: 'refuse', detail: 'code erroné ou expiré' },
  verrouillage: { libelle: 'Verrouillage', resultat: 'verrouillage', detail: 'trop d’échecs' },
  session_refusee: { libelle: 'Session refusée', resultat: 'refuse', detail: 'session expirée ou révoquée' },
  deconnexion: { libelle: 'Déconnexion', resultat: 'reussi', detail: 'session fermée par le bouton' },
  deconnexion_partout: { libelle: 'Déconnexion partout', resultat: 'reussi', detail: 'toutes les sessions révoquées, appareils de confiance oubliés' },
  appareil_enregistre: { libelle: 'Appareil mémorisé', resultat: 'reussi', detail: 'connexion gardée 30 jours sur cet appareil' },
  appareil_revoque: { libelle: 'Appareil révoqué', resultat: 'reussi', detail: 'mot de passe et code de nouveau demandés' },
};
export const FILTRES_JOURNAL = [
  { cle: 'tout', libelle: 'Tout', garde: () => true },
  { cle: 'echecs', libelle: 'Échecs', garde: (e) => EVENEMENTS[e.evenement]?.resultat === 'refuse' },
  { cle: 'verrouillages', libelle: 'Verrouillages', garde: (e) => e.evenement === 'verrouillage' },
  { cle: 'deconnexions', libelle: 'Déconnexions', garde: (e) => e.evenement.startsWith('deconnexion') },
];

const FUSEAU = 'Europe/Paris';
const nombre = new Intl.NumberFormat('fr-FR');
const eurosEntiers = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const eurosCentimes = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Intl sépare les milliers par une espace fine insécable (U+202F) que Inter n'a pas : espace insécable classique.
const insecable = (texte) => texte.replace(/\u202f/g, '\u00a0');
export const formaterNombre = (v) => insecable(nombre.format(v));
/** « 155 € » pour les totaux, « 33,83 € » pour une ligne. */
export const formaterEuros = (v, { centimes = false } = {}) => (v == null ? '—' : insecable((centimes ? eurosCentimes : eurosEntiers).format(v)));

/** Accepte un horodatage, une date PocketBase (« AAAA-MM-JJ HH:MM:SS.sssZ ») ou une date seule (« AAAA-MM-JJ »). */
const versDate = (v) => (typeof v === 'number' ? new Date(v) : /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T12:00:00Z`) : new Date(String(v).replace(' ', 'T')));
export const formaterJourMois = (v) => versDate(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', timeZone: FUSEAU });
/** « mer. 8 oct. » : le jour d'un point de courbe, avec son jour de semaine. */
export const formaterJourLong = (v) => versDate(v).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: FUSEAU });
export const formaterHeure = (v) => versDate(v).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: FUSEAU });
export const formaterDateHeure = (v) => `${formaterJourMois(v)} · ${formaterHeure(v)}`;
export const formaterDateCourte = (v) => versDate(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: FUSEAU });
export const formaterDateLongue = (v) => versDate(v).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: FUSEAU });

/** « dans 3 j », « demain », « aujourd’hui ». */
export const formaterDans = (jours) => (jours <= 0 ? 'aujourd’hui' : jours === 1 ? 'demain' : `dans ${jours} j`);

/** Adresse IP tronquée à l'affichage : les deux premiers octets (IPv4) ou groupes (IPv6). */
export function tronquerIp(ip) {
  if (!ip) return '—';
  if (ip.includes('.')) return `${ip.split('.').slice(0, 2).join('.')}.•••.•••`;
  return `${ip.split(':').slice(0, 2).join(':')}:••••`;
}

/** « Windows · Chrome » à partir d'un user-agent. */
export function decrireAppareil(agent = '') {
  if (!agent) return 'Appareil inconnu';
  if (/^curl\//i.test(agent)) return 'Script · curl';
  if (/python|node|axios|go-http|wget/i.test(agent) && !/Mozilla/.test(agent)) return 'Script';
  const systeme = /iPhone/.test(agent) ? 'iPhone' : /iPad/.test(agent) ? 'iPad' : /Android/.test(agent) ? 'Android' : /Windows/.test(agent) ? 'Windows' : /Mac OS X|Macintosh/.test(agent) ? 'macOS' : /Linux/.test(agent) ? 'Linux' : 'Système inconnu';
  const navigateur = /Edg\//.test(agent) ? 'Edge' : /OPR\//.test(agent) ? 'Opera' : /Firefox\//.test(agent) ? 'Firefox' : /Chrome\//.test(agent) ? 'Chrome' : /Safari\//.test(agent) ? 'Safari' : 'navigateur inconnu';
  return `${systeme} · ${navigateur}`;
}

/** Initiale du projet et couleur de texte lisible sur sa couleur d'accent. */
export function marqueProjet(projet) {
  const fond = projet.couleurAccent || '#94A3B8';
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(fond.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return { initiale: projet.nom.normalize('NFD').replace(/[^A-Za-z0-9]/g, '').charAt(0).toUpperCase(), fond, texte: luminance > 0.36 ? '#070b1a' : '#ffffff' };
}

/** Tri : production d'abord, puis développement, pause, abandon ; les applications mobiles en tête. */
export const trierProjets = (projets) =>
  [...projets].sort((a, b) => STATUTS[a.statut].ordre - STATUTS[b.statut].ordre || (a.type === 'mobile' ? 0 : 1) - (b.type === 'mobile' ? 0 : 1) || a.nom.localeCompare(b.nom, 'fr'));

/** Bento : les deux premiers projets en production en grand, le reste en production ou en cours en moyen. */
export function tailleCarte(projet, rang) {
  if (projet.statut === 'production' && rang < 2) return 'grande';
  if (projet.statut === 'production' || projet.statut === 'developpement') return 'moyenne';
  return 'petite';
}

/** Lignes de coût d'un projet : les siennes et les postes partagés qui le citent. */
export const coutsDuProjet = (couts, slug) => (couts?.lignes || []).filter((l) => l.projet === slug || l.partageAvec?.includes(slug));

export const mouvementReduit = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// ─────────────── Disponibilité en direct (GET /disponibilite) ───────────────
const GRAVITE_SANTE = { inconnu: -1, 'en-ligne': 0, lent: 1, alerte: 2, panne: 3 };
const NOM_CIBLE = { site: 'Site', pocketbase: 'PocketBase' };
/** Couleur de pastille pour un état de disponibilité. */
export const PASTILLE_SANTE = { 'en-ligne': 'en-ligne', lent: 'alerte', alerte: 'alerte', panne: 'panne', inconnu: 'inconnu' };

export const hote = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

/** « Site en ligne · 163 ms », « PocketBase répond 404 », « Site injoignable »… */
export function decrireCible(c) {
  const nom = NOM_CIBLE[c.type] || c.type;
  if (c.etat === 'en-ligne') return `${nom} en ligne · ${c.ms} ms`;
  if (c.etat === 'lent') return `${nom} lent · ${(c.ms / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} s`;
  if (c.etat === 'alerte') return `${nom} répond ${c.statut}`;
  if (c.etat === 'inconnu') return `${nom} : adresse supposée, sans réponse`;
  return c.statut ? `${nom} en erreur ${c.statut}` : `${nom} ${c.detail || 'injoignable'}`;
}

/** Résumé d'un projet pour sa carte : le temps le plus long si tout répond, sinon la cible la plus mal en point. */
export function resumerSante(sante) {
  if (sante.etat === 'en-ligne') return `En ligne · ${Math.max(...sante.cibles.map((c) => c.ms || 0))} ms`;
  const pire = sante.cibles.reduce((a, b) => (GRAVITE_SANTE[b.etat] > GRAVITE_SANTE[a.etat] ? b : a));
  return decrireCible(pire);
}

/** Alertes de disponibilité : panne ou alerte pour un projet en production, simple information sinon. */
export function alertesDisponibilite(projets, disponibilite) {
  if (!disponibilite?.resultats) return [];
  return projets
    .filter((p) => ['panne', 'alerte', 'lent'].includes(disponibilite.resultats[p.slug]?.etat))
    .map((p) => {
      const sante = disponibilite.resultats[p.slug];
      const enProduction = p.statut === 'production';
      const gravite = !enProduction ? 'info' : sante.etat === 'panne' ? 'panne' : 'alerte';
      const touchees = sante.cibles.filter((c) => c.etat !== 'en-ligne' && c.etat !== 'inconnu');
      return {
        gravite,
        titre: `${p.nom} · ${resumerSante(sante)}`,
        detail: `${touchees.map((c) => hote(c.url)).join(', ')}${enProduction ? '' : ` · projet ${STATUTS[p.statut].libelle.toLowerCase()}`}`,
        temps: formaterHeure(disponibilite.verifieLe),
        nouvelle: gravite === 'panne',
      };
    })
    .sort((a, b) => ['panne', 'alerte', 'info'].indexOf(a.gravite) - ['panne', 'alerte', 'info'].indexOf(b.gravite));
}

// ─────────────── Certificats et noms de domaine (GET /domaines) ───────────────
// Seuils : un certificat se renouvelle seul chez l'hébergeur dans ses trois dernières semaines, donc « à surveiller »
// sous 21 jours, alerte sous 10, panne sous 3 ou expiré. Un domaine se renouvelle à la main ou par prélèvement :
// à surveiller sous 45 jours, alerte sous 21, panne sous 7.
const SEUILS_ECHEANCE = { certificat: [21, 10, 3], domaine: [45, 21, 7] };
/** État d'une échéance : 'en-ligne' (loin), 'surveiller', 'alerte', 'panne'. */
export function etatEcheance(sorte, dansJours) {
  const [surveiller, alerte, panne] = SEUILS_ECHEANCE[sorte];
  if (dansJours < panne) return 'panne';
  if (dansJours < alerte) return 'alerte';
  return dansJours < surveiller ? 'surveiller' : 'en-ligne';
}
/** « expire dans 17 jours », « expire demain », « a expiré il y a 2 jours ». */
export function decrireEcheance(dansJours) {
  if (dansJours < 0) return `a expiré il y a ${-dansJours} jour${dansJours < -1 ? 's' : ''}`;
  if (dansJours === 0) return 'expire aujourd’hui';
  return dansJours === 1 ? 'expire demain' : `expire dans ${dansJours} jours`;
}

/** Certificat ou domaine qui approche de son terme : information d'abord, alerte puis panne pour un projet en production. */
export function alertesDomaines(projets, domaines) {
  if (!domaines?.projets) return [];
  return projets.flatMap((p) => {
    const d = domaines.projets[p.slug];
    if (!d) return [];
    const enProduction = p.statut === 'production';
    return [['certificat', d.certificat, 'Certificat', d.hote], ['domaine', d.enregistrement, 'Nom de domaine', d.domaine]]
      .filter(([, e]) => e && e.dansJours != null)
      .map(([sorte, e, libelle, quoi]) => ({ sorte, e, libelle, quoi, etat: etatEcheance(sorte, e.dansJours) }))
      .filter((a) => a.etat !== 'en-ligne')
      .map((a) => ({
        gravite: a.etat === 'surveiller' || !enProduction ? 'info' : a.etat,
        titre: `${p.nom} · ${a.libelle.toLowerCase()} : ${decrireEcheance(a.e.dansJours)}`,
        detail: `${a.quoi}${a.sorte === 'certificat' && a.etat === 'surveiller' ? ' · renouvellement automatique attendu' : ''}${a.sorte === 'domaine' && a.e.bureau ? ` · ${a.e.bureau}` : ''}`,
        temps: formaterJourMois(a.e.expireLe),
      }));
  });
}

// ─────────────── Activité GitHub (GET /activite) ───────────────
/** « à l’instant », « il y a 12 min », « il y a 3 h », « hier », « il y a 4 j », puis la date. */
export function formaterIlYa(date) {
  const ecart = (Date.now() - versDate(date).getTime()) / 60_000;
  if (ecart < 1) return 'à l’instant';
  if (ecart < 60) return `il y a ${Math.floor(ecart)} min`;
  if (ecart < 24 * 60) return `il y a ${Math.floor(ecart / 60)} h`;
  if (ecart < 48 * 60) return 'hier';
  if (ecart < 7 * 24 * 60) return `il y a ${Math.floor(ecart / (24 * 60))} j`;
  return formaterJourMois(date);
}

/** Dernière exécution de CI : pastille et libellé. */
export function etatCi(ci) {
  if (ci.etat !== 'completed') return { pastille: 'alerte', libelle: 'en cours' };
  if (ci.conclusion === 'success') return { pastille: 'en-ligne', libelle: 'réussie' };
  if (ci.conclusion === 'failure' || ci.conclusion === 'timed_out') return { pastille: 'panne', libelle: 'en échec' };
  return { pastille: 'inconnu', libelle: ci.conclusion || 'terminée' };
}

/** CI en échec sur la branche principale : alerte pour un projet en production, information sinon. */
export function alertesCi(projets, activite) {
  if (!activite?.branche) return [];
  return projets.flatMap((p) =>
    (activite.projets[p.slug] || [])
      .filter((d) => d.ci && etatCi(d.ci).pastille === 'panne')
      .map((d) => ({
        gravite: p.statut === 'production' ? 'alerte' : 'info',
        titre: `${p.nom} · CI en échec`,
        detail: `${d.nom} · ${d.ci.nom}${p.statut === 'production' ? '' : ` · projet ${STATUTS[p.statut].libelle.toLowerCase()}`}`,
        temps: formaterJourMois(d.ci.date),
      })),
  );
}

// ─────────────── Builds Expo (GET /builds) ───────────────
export const PLATEFORMES = { ios: 'iOS', android: 'Android' };
export const STORES = { ios: 'App Store', android: 'Google Play' };
const STATUTS_EXPO = {
  FINISHED: { libelle: 'terminé', etat: 'en-ligne' },
  ERRORED: { libelle: 'en échec', etat: 'panne' },
  CANCELED: { libelle: 'annulé', etat: 'inconnu' },
  IN_PROGRESS: { libelle: 'en cours', etat: 'alerte' },
  IN_QUEUE: { libelle: 'en file d’attente', etat: 'alerte' },
  NEW: { libelle: 'en préparation', etat: 'alerte' },
  PENDING_CANCEL: { libelle: 'en cours d’annulation', etat: 'inconnu' },
  AWAITING_BUILD: { libelle: 'attend son build', etat: 'alerte' },
};
export const statutExpo = (statut) => STATUTS_EXPO[statut] || { libelle: String(statut || '').toLowerCase(), etat: 'inconnu' };

/** Dernier build ou envoi de chaque plateforme en échec : alerte pour une application en production. */
export function alertesBuilds(projets, builds) {
  if (!builds?.branche) return [];
  return projets.flatMap((p) => {
    const app = builds.projets[p.slug];
    if (!app || app.erreur) return [];
    const derniers = (liste) => ['ios', 'android'].map((pl) => liste.find((e) => e.plateforme === pl)).filter((e) => e?.statut === 'ERRORED');
    const gravite = p.statut === 'production' ? 'alerte' : 'info';
    return [
      ...derniers(app.builds).map((b) => ({
        gravite,
        titre: `${p.nom} · build ${PLATEFORMES[b.plateforme]} en échec`,
        detail: `${b.version} (${b.numero})${b.erreur ? ` · ${b.erreur}` : ''}`,
        temps: formaterJourMois(b.date),
      })),
      ...derniers(app.envois).map((e) => ({
        gravite,
        titre: `${p.nom} · envoi ${STORES[e.plateforme]} en échec`,
        detail: `${e.version ? `${e.version} (${e.numero})` : 'version inconnue'}${e.erreur ? ` · ${e.erreur}` : ''}`,
        temps: formaterJourMois(e.date),
      })),
    ];
  });
}

/** Fil d'activité : commits GitHub, builds et mises à jour OTA mêlés, du plus récent au plus ancien. */
export function filActivite(activite, builds) {
  const commits = activite?.branche
    ? activite.recents.map((c) => ({ cle: c.url, date: c.date, icone: 'terminal', texte: c.message, lien: c.url, detail: `${c.projet} · ${c.depot.split('/')[1]}` }))
    : [];
  const expo = builds?.branche
    ? builds.recents.map((e) => (e.type === 'build'
      ? { cle: e.url, date: e.date, icone: 'fusee', etat: statutExpo(e.statut).etat, texte: `Build ${PLATEFORMES[e.plateforme]} ${e.version} (${e.numero}) ${statutExpo(e.statut).libelle}`, lien: e.url, detail: `${e.projet} · profil ${e.profil}` }
      : { cle: e.url, date: e.date, icone: 'activite', texte: `Mise à jour OTA${e.message ? ` « ${e.message} »` : ''}`, lien: e.url, detail: `${e.projet} · branche ${e.branche}` }))
    : [];
  return [...commits, ...expo].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
}

// ─────────────── App Store (GET /stores) ───────────────
/** État d'une version sur App Store Connect : libellé, pastille, et s'il appelle une action de ta part. */
const ETATS_VERSION = {
  READY_FOR_SALE: { libelle: 'en vente', etat: 'en-ligne' },
  PENDING_DEVELOPER_RELEASE: { libelle: 'validée par Apple, à publier', etat: 'alerte', action: true },
  PENDING_APPLE_RELEASE: { libelle: 'validée, publication par Apple', etat: 'en-ligne' },
  WAITING_FOR_REVIEW: { libelle: 'en attente de revue', etat: 'alerte', suivi: true },
  IN_REVIEW: { libelle: 'en revue chez Apple', etat: 'alerte', suivi: true },
  PROCESSING_FOR_APP_STORE: { libelle: 'en traitement', etat: 'alerte' },
  READY_FOR_REVIEW: { libelle: 'prête pour la revue', etat: 'alerte' },
  WAITING_FOR_EXPORT_COMPLIANCE: { libelle: 'conformité à l’export à fournir', etat: 'alerte', action: true },
  REJECTED: { libelle: 'refusée par Apple', etat: 'panne', action: true },
  METADATA_REJECTED: { libelle: 'fiche refusée par Apple', etat: 'panne', action: true },
  INVALID_BINARY: { libelle: 'binaire refusé', etat: 'panne', action: true },
  DEVELOPER_REJECTED: { libelle: 'retirée de la revue', etat: 'inconnu' },
  PREPARE_FOR_SUBMISSION: { libelle: 'en préparation, jamais soumise', etat: 'inconnu' },
  REMOVED_FROM_SALE: { libelle: 'retirée de la vente', etat: 'inconnu' },
  DEVELOPER_REMOVED_FROM_SALE: { libelle: 'retirée de la vente', etat: 'inconnu' },
  REPLACED_WITH_NEW_VERSION: { libelle: 'remplacée', etat: 'inconnu' },
};
export const etatVersion = (etat) => ETATS_VERSION[etat] || { libelle: String(etat || '').toLowerCase().replace(/_/g, ' '), etat: 'inconnu' };

/** Version validée à publier, refusée, ou en revue : alerte pour un projet actif, information s'il est en pause. */
export function alertesAppStore(projets, stores) {
  const ios = stores?.ios;
  if (!ios?.branche || !ios.projets) return [];
  return projets.flatMap((p) => {
    const v = ios.projets[p.slug]?.derniereVersion;
    const e = v && etatVersion(v.etat);
    if (!e || (!e.action && !e.suivi)) return [];
    const actif = p.statut === 'production' || p.statut === 'developpement';
    return [{
      gravite: e.action && actif ? (e.etat === 'panne' ? 'panne' : 'alerte') : 'info',
      titre: `${p.nom} ${v.version} · ${e.libelle}`,
      detail: 'App Store Connect',
      temps: formaterJourMois(v.date),
    }];
  });
}

const NOMS_PAYS = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['fr'], { type: 'region' }) : null;
/** « FR » → « France ». */
export const nomPays = (code) => {
  try {
    return NOMS_PAYS?.of(code) || code;
  } catch {
    return code;
  }
};

// ─────────────── Google Play (GET /stores → android) ───────────────
/** « 0,12 % » à partir d'un taux (0,0012). */
export const formaterTaux = (taux) => `${(taux * 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`;

/** Taux de plantage ou de blocage au-dessus du seuil de Google : alerte pour une application en production. */
export function alertesGooglePlay(projets, stores) {
  const android = stores?.android;
  if (!android?.branche || !android.projets) return [];
  return projets.flatMap((p) => {
    const app = android.projets[p.slug];
    if (!app || app.absente) return [];
    return [['plantages', 'Taux de plantage'], ['anr', 'Taux de blocage (ANR)']]
      .filter(([cle]) => app.qualite[cle].taux != null && app.qualite[cle].taux > app.qualite[cle].seuil)
      .map(([cle, libelle]) => ({
        gravite: p.statut === 'production' ? 'alerte' : 'info',
        titre: `${p.nom} · ${libelle} Android au-dessus du seuil`,
        detail: `${formaterTaux(app.qualite[cle].taux)} sur 28 jours, seuil Google ${formaterTaux(app.qualite[cle].seuil)}`,
        temps: null,
      }));
  });
}

// ─────────────── PocketBase des projets (GET /pocketbase/…) ───────────────
// Mêmes libellés que le tableau de bord du site Honn'Eure (site/lib/mesure/sources.js et agregats.js).
export const LIBELLES_CANAL = { recherche: 'Moteurs de recherche', ia: 'Assistants IA', social: 'Réseaux sociaux', site: 'Autres sites', email: 'E-mails', campagne: 'Campagnes', direct: 'Accès direct' };
export const LIBELLES_APPAREIL = { ordinateur: 'Ordinateur', mobile: 'Téléphone', tablette: 'Tablette' };
export const ROLES_MEMBRE = { membre: 'Membre', moderateur: 'Modérateur', admin: 'Administrateur' };

/** Texte comparable pour une recherche : minuscules, sans accents. */
export const sansAccents = (texte = '') => texte.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/** « 06 12 34 56 78 » pour un numéro français à 10 chiffres ; tout autre format tel quel. */
export function formaterTelephone(numero = '') {
  const chiffres = numero.replace(/\D/g, '');
  return /^0\d{9}$/.test(chiffres) ? chiffres.replace(/(\d{2})(?=\d)/g, '$1\u00a0') : numero;
}

/**
 * Jours absents ajoutés à zéro : la courbe garde une échelle de temps juste. Du premier au dernier jour mesuré
 * (trafic : avant la première mesure, rien n'était compté), ou sur `fenetre` jours jusqu'à aujourd'hui (inscriptions :
 * un jour sans inscription est un vrai zéro).
 */
export function joursContinus(jours = [], { fenetre } = {}) {
  if (!jours.length && !fenetre) return [];
  const JOUR = 24 * 60 * 60_000;
  const parJour = new Map(jours.map((j) => [j.jour, j]));
  const zero = Object.fromEntries(Object.keys(jours[0] || { valeur: 0 }).filter((k) => k !== 'jour').map((k) => [k, 0]));
  const aujourdhui = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  const debut = fenetre ? aujourdhui - (fenetre - 1) * JOUR : Date.parse(`${jours[0].jour}T00:00:00Z`);
  const fin = fenetre ? aujourdhui : Date.parse(`${jours.at(-1).jour}T00:00:00Z`);
  const liste = [];
  for (let t = debut; t <= fin; t += JOUR) {
    const jour = new Date(t).toISOString().slice(0, 10);
    liste.push(parJour.get(jour) || { jour, ...zero });
  }
  return liste;
}

/** Module « tableau de bord » d'un PocketBase illisible (clé refusée, module absent, instance injoignable). */
export function alertesPocketbase(projets, pocketbase) {
  if (!pocketbase?.branche) return [];
  return projets
    .filter((p) => pocketbase.projets[p.slug]?.erreur)
    .map((p) => ({ gravite: 'info', titre: `${p.nom} · membres et trafic illisibles`, detail: pocketbase.projets[p.slug].erreur, temps: formaterHeure(pocketbase.verifieLe) }));
}
