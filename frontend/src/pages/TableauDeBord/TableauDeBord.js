import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate } from 'react-router-dom';
import { useClientApi } from './api';
import { BarreMobile, EnTete } from './composants/EnTete';
import { CHEMINS, ROUTE_TABLEAU_DE_BORD } from './constantes';
import Connexion from './ecrans/Connexion';
import Documents from './ecrans/Documents';
import FicheProjet from './ecrans/FicheProjet';
import Securite from './ecrans/Securite';
import Signatures from './ecrans/Signatures';
import VueEnsemble from './ecrans/VueEnsemble';
import { reinitialiserGenerique } from './mouvement';
import { mouvementReduit } from './outils';
import { useSource } from './sources';
import { useThemeTableau } from './theme';
// Styles chargés avec la page seulement (paquet paresseux) : les visiteurs du portfolio ne les téléchargent pas.
import '../../styles/pages/tableau-de-bord/_index.scss';

// Tableau de bord privé. Aucune donnée dans ce code : tout vient de l'API, qui refuse tout sans session
// (cookie httpOnly posé par l'API, vérifié côté serveur à chaque requête).

const POLICES = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700&family=Inter:wght@400;500;600&display=swap';
const DONNEES_VIDES = { projets: [], couts: null, session: null };

const TableauDeBord = () => {
  const appeler = useClientApi();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { preference, theme, changer: changerTheme } = useThemeTableau();

  const [etape, setEtape] = useState('chargement'); // chargement | identifiants | code | connecte
  const [erreur, setErreur] = useState('');
  // Générique d'ouverture (motion v2) : décidé une fois, au premier rendu connecté, s'il arrive sur la vue d'ensemble.
  const generiqueSession = useRef(null);
  const [rideauFini, setRideauFini] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [tentativeCode, setTentativeCode] = useState(0);
  const [donnees, setDonnees] = useState(DONNEES_VIDES);
  const [dernierProjet, setDernierProjet] = useState(null);
  // Coffre de documents (contrats signés, factures, devis) : null (lecture en cours), 'erreur', ou la réponse de l'API.
  const [coffre, setCoffre] = useState(null);
  const coffreLuLe = useRef(0);
  const positionVue = useRef(0);
  const finDeRendu = useRef(null);

  const sousChemin = pathname.slice(ROUTE_TABLEAU_DE_BORD.length).replace(/^\/+|\/+$/g, '');
  const ecran = sousChemin === '' ? 'vue' : ['securite', 'signatures', 'documents'].includes(sousChemin) ? sousChemin : 'fiche';
  const projetOuvert = ecran === 'fiche' ? donnees.projets.find((p) => p.slug === sousChemin) : null;

  // Thème appliqué aussi à <html> : fond du rebond de défilement et capture des View Transitions.
  useEffect(() => {
    document.documentElement.dataset.tdbTheme = theme;
    return () => {
      delete document.documentElement.dataset.tdbTheme;
    };
  }, [theme]);

  // Fin du rendu d'un écran : libère la View Transition en attente, sinon (bouton retour du navigateur)
  // replace le défilement : position mémorisée pour la vue d'ensemble, haut de page ailleurs.
  useLayoutEffect(() => {
    if (finDeRendu.current) {
      finDeRendu.current();
      finDeRendu.current = null;
    } else {
      window.scrollTo(0, ecran === 'vue' ? positionVue.current : 0);
    }
  }, [pathname]);

  /**
   * Navigation interne. Le routeur du site rend en différé (v7_startTransition) : la View Transition attend donc
   * le vrai rendu du nouvel écran (useLayoutEffect ci-dessus) avant de capturer l'état d'arrivée.
   */
  const naviguer = useCallback(
    (chemin, { apres, classe } = {}) => {
      if (chemin === pathname) return;
      if (!document.startViewTransition || mouvementReduit()) {
        finDeRendu.current = () => apres?.();
        navigate(chemin);
        return;
      }
      const racine = document.documentElement;
      if (classe) racine.classList.add(classe);
      const transition = document.startViewTransition(
        () =>
          new Promise((resoudre) => {
            const fin = () => {
              apres?.();
              resoudre();
            };
            finDeRendu.current = fin;
            navigate(chemin);
            // filet de sécurité : jamais plus de 600 ms d'écran figé si le rendu n'arrive pas
            setTimeout(() => {
              if (finDeRendu.current === fin) {
                finDeRendu.current = null;
                fin();
              }
            }, 600);
          }),
      );
      // Transition abandonnée (fenêtre redimensionnée, onglet masqué…) : la navigation a lieu quand même, sans animation.
      transition.ready.catch(() => {});
      if (classe) transition.finished.finally(() => racine.classList.remove(classe));
    },
    [navigate, pathname],
  );

  /** Ouvre la fiche : la carte cliquée et le héros de la fiche partagent un nom de transition (morphose). */
  const ouvrirProjet = useCallback(
    (projet, carte) => {
      positionVue.current = window.scrollY;
      document.querySelectorAll('.tdb-carte, .tdb-carte .tdb-logo').forEach((n) => {
        n.style.viewTransitionName = '';
      });
      carte.style.viewTransitionName = 'tdb-projet';
      const logo = carte.querySelector('.tdb-logo');
      if (logo) logo.style.viewTransitionName = 'tdb-projet-logo';
      setDernierProjet(projet.slug);
      naviguer(CHEMINS.fiche(projet.slug), { classe: 'tdb-vt-fiche', apres: () => window.scrollTo(0, 0) });
    },
    [naviguer],
  );

  const retourVue = useCallback(
    (e) => {
      if (e && (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return;
      e?.preventDefault();
      naviguer(CHEMINS.vue, { classe: 'tdb-vt-retour', apres: () => window.scrollTo(0, positionVue.current) });
    },
    [naviguer],
  );

  const recommencer = useCallback(
    async (message = '') => {
      setDonnees(DONNEES_VIDES);
      setCoffre(null);
      coffreLuLe.current = 0;
      setErreur(message);
      generiqueSession.current = null;
      reinitialiserGenerique();
      setRideauFini(false);
      try {
        await appeler('/csrf');
      } catch {
        setErreur('Service injoignable. Réessaie dans un instant.');
      }
      setEtape('identifiants');
    },
    [appeler],
  );
  const sessionExpiree = useCallback(() => recommencer('Session expirée : reconnecte-toi.'), [recommencer]);

  const chargerDonnees = useCallback(async () => {
    const [p, c, s] = await Promise.all([appeler('/projets'), appeler('/couts'), appeler('/session')]);
    if ([p, c, s].some((r) => r.statut === 401)) return sessionExpiree();
    if (p.statut !== 200) return setErreur('Données momentanément indisponibles. Réessaie dans un instant.');
    setDonnees({ projets: p.json.projets || [], couts: c.statut === 200 ? c.json : null, session: s.statut === 200 ? s.json : null });
    setErreur('');
    return setEtape('connecte');
  }, [appeler, sessionExpiree]);

  /**
   * Coffre de documents, lu pour l'écran Documents et le panneau « Documents » des fiches. `force` : relecture
   * immédiate après un dépôt, une modification, une suppression ou un rangement ; sinon une lecture par minute au plus.
   */
  const chargerCoffre = useCallback(
    async ({ force = false } = {}) => {
      if (!force && Date.now() - coffreLuLe.current < 60_000) return undefined;
      coffreLuLe.current = Date.now();
      try {
        const { statut, json } = await appeler('/documents');
        if (statut === 401) return sessionExpiree();
        if (statut !== 200) coffreLuLe.current = 0;
        return setCoffre(statut === 200 ? json : 'erreur');
      } catch {
        coffreLuLe.current = 0;
        return setCoffre('erreur');
      }
    },
    [appeler, sessionExpiree],
  );
  const relireCoffre = useCallback(() => chargerCoffre({ force: true }), [chargerCoffre]);
  // Lu aussi pour la vue d'ensemble : contrats à renouveler dans les alertes, dates des documents dans les échéances.
  useEffect(() => {
    if (etape === 'connecte' && (ecran === 'documents' || ecran === 'fiche' || ecran === 'vue')) chargerCoffre();
  }, [etape, ecran, sousChemin, chargerCoffre]);

  // Sources chargées à part, sans bloquer l'affichage, relues en changeant d'écran quand elles ont vieilli :
  // vérification en direct (l'API la garde 60 s) et activité GitHub (10 min).
  const sourcesActives = etape === 'connecte' && ecran !== 'securite' && ecran !== 'signatures' && ecran !== 'documents';
  const disponibilite = useSource(appeler, '/disponibilite', { actif: sourcesActives, declencheur: ecran, fraicheurMs: 60_000, onSessionExpiree: sessionExpiree });
  const activite = useSource(appeler, '/activite', { actif: sourcesActives, declencheur: ecran, fraicheurMs: 10 * 60_000, onSessionExpiree: sessionExpiree });
  const builds = useSource(appeler, '/builds', { actif: sourcesActives, declencheur: ecran, fraicheurMs: 10 * 60_000, onSessionExpiree: sessionExpiree });
  const stores = useSource(appeler, '/stores', { actif: sourcesActives, declencheur: ecran, fraicheurMs: 6 * 60 * 60_000, onSessionExpiree: sessionExpiree });
  // Certificat et nom de domaine de chaque site : dates d'expiration, gardées 12 h par l'API.
  const domaines = useSource(appeler, '/domaines', { actif: sourcesActives, declencheur: ecran, fraicheurMs: 6 * 60 * 60_000, onSessionExpiree: sessionExpiree });
  // Sites suivis par les journaux de leur hébergeur (lunello.family) : l'API relit les derniers jours une fois par heure.
  const sites = useSource(appeler, '/sites', { actif: sourcesActives, declencheur: ecran, fraicheurMs: 15 * 60_000, onSessionExpiree: sessionExpiree });
  // PocketBase des projets (module « tableau de bord ») : totaux des membres et trafic, gardés 5 min par l'API.
  const pocketbase = useSource(appeler, '/pocketbase/resume', { actif: sourcesActives, declencheur: ecran, fraicheurMs: 5 * 60_000, onSessionExpiree: sessionExpiree });

  useEffect(() => {
    (async () => {
      try {
        const { json } = await appeler('/csrf');
        if (json.etape === 'connecte') return await chargerDonnees();
        return setEtape(json.etape === 'code' ? 'code' : 'identifiants');
      } catch {
        setErreur('Service injoignable. Réessaie dans un instant.');
        return setEtape('identifiants');
      }
    })();
  }, [appeler, chargerDonnees]);

  const avecAttente = async (action) => {
    setErreur('');
    setOccupe(true);
    try {
      await action();
    } catch {
      setErreur('Service injoignable. Réessaie dans un instant.');
    } finally {
      setOccupe(false);
    }
  };

  const envoyerIdentifiants = (email, motDePasse, seSouvenir) =>
    avecAttente(async () => {
      const { statut, json } = await appeler('/connexion', { methode: 'POST', corps: { email, motDePasse, seSouvenir: seSouvenir === true } });
      // Appareil de confiance reconnu : l'API a ouvert la session sans code.
      if (statut === 200 && json.etape === 'connecte') return chargerDonnees();
      if (statut === 200) return setEtape('code');
      if (statut === 403) await appeler('/csrf');
      return setErreur(json.erreur || 'Connexion impossible.');
    });

  const envoyerCode = (code) =>
    avecAttente(async () => {
      const { statut, json } = await appeler('/connexion/code', { methode: 'POST', corps: { code } });
      if (statut === 200) return chargerDonnees();
      if (statut === 401 && json.erreur !== 'Identifiants ou code invalides.') return recommencer(json.erreur);
      setTentativeCode((n) => n + 1);
      return setErreur(json.erreur || 'Code refusé.');
    });

  const deconnecter = async (partout) => {
    if (partout && !window.confirm('Déconnecter toutes les sessions, sur tous les appareils ?')) return;
    setOccupe(true);
    let reponse = null;
    try {
      reponse = await appeler(partout ? '/deconnexion/partout' : '/deconnexion', { methode: 'POST' });
    } catch {
      reponse = null;
    }
    setOccupe(false);
    // La session est un cookie scellé que seule la réponse du serveur efface. 200 : effacé ; 401 : déjà expirée.
    // Tout autre cas (limite de débit, réseau) : la session reste ouverte, on le dit au lieu d'afficher la connexion.
    if (reponse && (reponse.statut === 200 || reponse.statut === 401)) {
      recommencer(partout ? 'Toutes les sessions ont été déconnectées.' : '');
      return;
    }
    setErreur(
      reponse?.statut === 429
        ? 'Trop de requêtes : la déconnexion n’a pas abouti et la session reste ouverte. Réessaie dans une minute.'
        : 'Déconnexion impossible pour le moment : la session reste ouverte. Réessaie dans un instant.',
    );
  };

  /** Onglet « Alertes » de la barre mobile : défile jusqu'au panneau des alertes de la vue d'ensemble. */
  const allerAuxAlertes = () => {
    const defiler = () => document.getElementById('tdb-alertes')?.scrollIntoView({ behavior: mouvementReduit() ? 'auto' : 'smooth', block: 'start' });
    if (ecran === 'vue') defiler();
    else naviguer(CHEMINS.vue, { apres: defiler });
  };

  if (etape === 'connecte' && generiqueSession.current === null) generiqueSession.current = ecran === 'vue' && !mouvementReduit();
  const generique = Boolean(generiqueSession.current);

  // Filet de sécurité : le rideau disparaît même si son animation ne se termine jamais (onglet masqué…).
  useEffect(() => {
    if (!generique || rideauFini) return undefined;
    const minuteur = setTimeout(() => setRideauFini(true), 1500);
    return () => clearTimeout(minuteur);
  }, [generique, rideauFini]);

  const titre = etape !== 'connecte' ? 'Connexion' : ecran === 'securite' ? 'Sécurité' : ecran === 'signatures' ? 'Signatures' : ecran === 'documents' ? 'Documents' : ecran === 'fiche' ? projetOuvert?.nom || 'Projet' : 'Vue d’ensemble';

  return (
    <div className="tdb" data-tdb-theme={theme}>
      <Helmet>
        <title>{`${titre} · Tableau de bord`}</title>
        <meta name="robots" content="noindex, nofollow, noarchive" />
        <meta name="referrer" content="no-referrer" />
        <link rel="stylesheet" href={POLICES} />
      </Helmet>
      <div className="tdb__lueurs" aria-hidden="true">
        <span className="tdb__lueur tdb__lueur--menthe" />
        <span className="tdb__lueur tdb__lueur--bleu" />
        <span className="tdb__lueur tdb__lueur--bleu-bas" />
      </div>

      {etape !== 'connecte' ? (
        <Connexion
          etape={etape}
          occupe={occupe}
          erreur={erreur}
          tentative={tentativeCode}
          onIdentifiants={envoyerIdentifiants}
          onCode={envoyerCode}
          onRecommencer={() => recommencer()}
        />
      ) : (
        <>
          {generique && !rideauFini && <div className="tdb-rideau" aria-hidden="true" onAnimationEnd={(e) => e.animationName === 'tdb-rideau-leve' && setRideauFini(true)} />}
          <EnTete ecran={ecran} preference={preference} onTheme={changerTheme} onDeconnexion={() => deconnecter(false)} naviguer={naviguer} occupe={occupe} generique={generique} />
          <main className="tdb__contenu" id="tdb-contenu">
            {erreur && (
              <p className="tdb-bandeau" role="alert">
                {erreur}
              </p>
            )}
            {ecran === 'vue' && <VueEnsemble projets={donnees.projets} couts={donnees.couts} disponibilite={disponibilite} domaines={domaines} activite={activite} builds={builds} stores={stores} sites={sites} pocketbase={pocketbase} coffre={coffre} dernierProjet={dernierProjet} onOuvrir={ouvrirProjet} generique={generique} />}
            {ecran === 'fiche' && <FicheProjet key={sousChemin} projet={projetOuvert} couts={donnees.couts} disponibilite={disponibilite} domaines={domaines} activite={activite} builds={builds} stores={stores} sites={sites} pocketbase={pocketbase} coffre={coffre} projets={donnees.projets} onCoffreChange={relireCoffre} naviguer={naviguer} appeler={appeler} onSessionExpiree={sessionExpiree} onRetour={retourVue} />}
            {ecran === 'securite' && (
              <Securite appeler={appeler} session={donnees.session} occupe={occupe} onSessionExpiree={sessionExpiree} onDeconnexionPartout={() => deconnecter(true)} />
            )}
            {ecran === 'signatures' && <Signatures appeler={appeler} projets={donnees.projets} onCoffreChange={relireCoffre} onSessionExpiree={sessionExpiree} />}
            {ecran === 'documents' && <Documents appeler={appeler} coffre={coffre} projets={donnees.projets} onChangement={relireCoffre} onSessionExpiree={sessionExpiree} naviguer={naviguer} />}
          </main>
          <BarreMobile ecran={ecran} naviguer={naviguer} onAlertes={allerAuxAlertes} />
        </>
      )}
    </div>
  );
};

export default TableauDeBord;
