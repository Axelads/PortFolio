import React, { useEffect, useMemo, useRef, useState } from 'react';
import Barres from './Barres';
import { Badge, Bouton, Compteur, Onglets, Pastille, SourceNonBranchee } from './elements';
import InterrupteurGlissant from './InterrupteurGlissant';
import RendezVous from './RendezVous';
import { formaterDateHeure, formaterHeure, formaterIlYa, formaterJourMois, formaterNombre, LIBELLES_APPAREIL, LIBELLES_CANAL, nomPays } from '../outils';

// Trois origines possibles, même affichage : mesures reçues par l'API (portfolio, sites hébergés : compteurs de
// collecte, pays), ou lignes lues dans le PocketBase d'un site qui se mesure lui-même (Honn'Eure, boutiques). Ce
// qu'un site ne mesure pas (`mesure.absents` : pays, navigateur, système) n'est pas affiché, jamais inventé.
// Fréquentation détaillée d'un site (GET /pocketbase/:slug/trafic) : mesure maison sans cookie — visites reconstruites
// par l'API, comparaison avec la période précédente, visiteurs en ce moment — et statistiques du serveur (Awstats
// d'o2switch) quand le site en a. Deux séries de couleur, validées pour les deux thèmes (skill dataviz) : visites et
// pages vues ; chaque barre a sa bulle au survol ou au clavier, chaque graphique sa légende.

const PERIODES = [
  { cle: 'jour', libelle: 'Aujourd’hui', avant: 'hier' },
  { cle: '7', libelle: '7 jours', avant: 'les 7 jours précédents' },
  { cle: '30', libelle: '30 jours', avant: 'les 30 jours précédents' },
  { cle: '90', libelle: '90 jours', avant: 'les 90 jours précédents' },
];
/** Drapeau localStorage lu par le site (même origine) : « ne pas compter mes visites depuis cet appareil ». */
const CLE_EXCLUSION = 'mesure-exclue';
const FRAICHEUR_MS = 2 * 60_000;
const DIRECT_MS = 60_000;
const LIBELLES_ACTION = { sortant: 'Lien sortant', email: 'E-mail', telephone: 'Téléphone', fichier: 'Téléchargement', formulaire: 'Formulaire', 'rendez-vous': 'Prendre rendez-vous', reservation: 'Rendez-vous confirmé', 'agenda-externe': 'Agenda externe', autre: 'Autre' };
const LIBELLES_ORIGINE = { direct: 'Accès direct ou favori', moteurs: 'Moteurs de recherche', sites: 'Autres sites', forums: 'Forums et actualités', interne: 'Pages internes', inconnue: 'Origine inconnue' };
const JOURS_COURTS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const formaterDuree = (s) => {
  const n = Math.round(s || 0);
  if (!n) return '—';
  return n < 60 ? `${n} s` : `${Math.floor(n / 60)} min ${String(n % 60).padStart(2, '0')} s`;
};
const formaterDecimal = (v) => (v || 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
const formaterMois = (m) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
const formaterOctets = (o) => (o >= 1e9 ? `${(o / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Go` : o >= 1e6 ? `${(o / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo` : `${Math.round(o / 1e3)} Ko`);
const pluriel = (n, mot) => `${formaterNombre(n)} ${mot}${n > 1 ? 's' : ''}`;
const pagesVuesTexte = (n) => `${formaterNombre(n)} page${n > 1 ? 's' : ''} vue${n > 1 ? 's' : ''}`;
const lireExclusion = () => {
  try {
    return localStorage.getItem(CLE_EXCLUSION) === '1';
  } catch {
    return false;
  }
};

/** Fréquentation d'une période, gardée 2 min par période ; l'affichage précédent reste pendant le chargement. */
function useTrafic(appeler, slug, periode, avecEquipe, onSessionExpiree) {
  const cle = `${periode}|${avecEquipe ? 1 : 0}`;
  const [etat, setEtat] = useState({ cle: '', donnees: null });
  const cache = useRef(new Map());
  useEffect(() => {
    const deja = cache.current.get(cle);
    if (deja && Date.now() - deja.recuLe < FRAICHEUR_MS) {
      setEtat({ cle, donnees: deja.donnees });
      return undefined;
    }
    let annule = false;
    appeler(`/pocketbase/${slug}/trafic?periode=${periode}${avecEquipe ? '&equipe=1' : ''}`)
      .then(({ statut, json }) => {
        if (annule) return;
        if (statut === 401) {
          onSessionExpiree();
          return;
        }
        const donnees = statut === 200 ? json : 'erreur';
        if (statut === 200) cache.current.set(cle, { donnees, recuLe: Date.now() });
        setEtat({ cle, donnees });
      })
      .catch(() => {
        if (!annule) setEtat({ cle, donnees: 'erreur' });
      });
    return () => {
      annule = true;
    };
  }, [appeler, slug, periode, avecEquipe, cle, onSessionExpiree]);
  return { donnees: etat.donnees, chargement: etat.cle !== cle };
}

/** Visiteurs des cinq dernières minutes, relus chaque minute tant que l'onglet est visible. */
function useEnDirect(appeler, slug, onSessionExpiree) {
  const [direct, setDirect] = useState(null);
  useEffect(() => {
    let actif = true;
    const lire = () => {
      if (document.hidden) return;
      appeler(`/pocketbase/${slug}/en-direct`)
        .then(({ statut, json }) => {
          if (!actif) return;
          if (statut === 401) {
            onSessionExpiree();
            return;
          }
          setDirect(statut === 200 ? json : 'erreur');
        })
        .catch(() => {
          if (actif) setDirect('erreur');
        });
    };
    lire();
    const minuterie = setInterval(lire, DIRECT_MS);
    document.addEventListener('visibilitychange', lire);
    return () => {
      actif = false;
      clearInterval(minuterie);
      document.removeEventListener('visibilitychange', lire);
    };
  }, [appeler, slug, onSessionExpiree]);
  return direct;
}

/** Évolution par rapport à la période précédente : vert quand c'est bon signe, ambre sinon (le rebond est inversé). */
const Evolution = ({ evo, inverse = false }) => {
  if (!evo) return null;
  const ton = evo.sens === 'stable' ? 'neutre' : (evo.sens === 'hausse') !== inverse ? 'en-ligne' : 'alerte';
  return <Badge ton={ton}>{evo.texte}</Badge>;
};

/** Au-delà de 45 jours, par semaine (du lundi) : 90 colonnes ne se lisent pas. */
function grouperJours(parJour) {
  if (parJour.length <= 45) return parJour.map((j) => ({ cle: j.jour, libelle: formaterJourMois(j.jour), visites: j.visites, pagesVues: j.pagesVues, visiteurs: j.visiteurs }));
  const semaines = new Map();
  for (const j of parJour) {
    const d = new Date(`${j.jour}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    const cle = d.toISOString().slice(0, 10);
    const s = semaines.get(cle) || { cle, libelle: `semaine du ${formaterJourMois(cle)}`, visites: 0, pagesVues: 0, visiteurs: 0 };
    s.visites += j.visites;
    s.pagesVues += j.pagesVues;
    s.visiteurs += j.visiteurs;
    semaines.set(cle, s);
  }
  return [...semaines.values()];
}

/** Visites et pages vues par jour (ou par semaine) : deux séries, légende, bulle par colonne. */
const GraphiqueJours = ({ parJour }) => {
  const colonnes = useMemo(() => grouperJours(parJour), [parJour]);
  const max = Math.max(1, ...colonnes.map((c) => Math.max(c.visites, c.pagesVues)));
  if (!colonnes.some((c) => c.pagesVues)) return <p className="tdb-vide">Aucune page vue sur la période.</p>;
  const parSemaine = colonnes.length < parJour.length;
  return (
    <figure className="tdb-freq__graphique">
      <figcaption className="tdb-freq__legende">
        <span className="tdb-freq__serie tdb-freq__serie--visites">Visites</span>
        <span className="tdb-freq__serie tdb-freq__serie--pages">Pages vues</span>
        <span className="tdb-freq__legende-note">par {parSemaine ? 'semaine' : 'jour'}</span>
      </figcaption>
      <div className="tdb-freq__colonnes" role="img" aria-label={`Visites et pages vues par ${parSemaine ? 'semaine' : 'jour'}, du ${colonnes[0].libelle} au ${colonnes.at(-1).libelle}`} style={{ '--colonnes': colonnes.length }}>
        {colonnes.map((c, i) => (
          <div key={c.cle} className="tdb-freq__colonne" style={{ '--i': i }} tabIndex={0}>
            <i className="tdb-freq__barre tdb-freq__barre--visites" style={{ '--h': c.visites / max }} />
            <i className="tdb-freq__barre tdb-freq__barre--pages" style={{ '--h': c.pagesVues / max }} />
            <span className="tdb-freq__bulle" role="tooltip">
              <strong>{c.libelle}</strong> · {pluriel(c.visites, 'visite')} · {pagesVuesTexte(c.pagesVues)} · {pluriel(c.visiteurs, 'visiteur')}
            </span>
          </div>
        ))}
      </div>
      <div className="tdb-freq__axe" aria-hidden="true">
        <span>{colonnes[0].libelle}</span>
        {colonnes.length > 2 && <span>{colonnes[Math.floor(colonnes.length / 2)].libelle}</span>}
        <span>{colonnes.at(-1).libelle}</span>
      </div>
    </figure>
  );
};

/** Petites colonnes d'une seule série (heures, jours de la semaine, mois du serveur). */
const MiniBarres = ({ titre, elements, unite = 'visite', note }) => {
  const max = Math.max(1, ...elements.map((e) => e.valeur));
  return (
    <section className="tdb-freq__mini">
      <h3 className="tdb-repartition__titre">{titre}</h3>
      <div className="tdb-freq__mini-colonnes" role="img" aria-label={`${titre} : ${elements.map((e) => `${e.libelle} ${formaterNombre(e.valeur)}`).join(', ')}`}>
        {elements.map((e, i) => (
          <div key={e.cle} className="tdb-freq__mini-colonne" style={{ '--i': i }} tabIndex={0}>
            <i className="tdb-freq__barre tdb-freq__barre--visites" style={{ '--h': e.valeur / max }} />
            {e.axe && <span className="tdb-freq__mini-axe">{e.axe}</span>}
            <span className="tdb-freq__bulle" role="tooltip">
              <strong>{e.libelle}</strong> · {pluriel(e.valeur, unite)}
            </span>
          </div>
        ))}
      </div>
      {note && <p className="tdb-freq__note">{note}</p>}
    </section>
  );
};

const TablePages = ({ pages }) => {
  const [nombre, setNombre] = useState(10);
  const visibles = pages.slice(0, nombre);
  return (
    <section className="tdb-freq__bloc">
      <h3 className="tdb-repartition__titre">Pages lues</h3>
      {pages.length ? (
        <>
          <div className="tdb-freq__defilement">
            <table className="tdb-freq__table">
              <thead>
                <tr>
                  <th scope="col">Page</th>
                  <th scope="col" className="tdb-freq__nombre">Vues</th>
                  <th scope="col" className="tdb-freq__nombre">Visiteurs</th>
                  <th scope="col" className="tdb-freq__nombre">Entrées</th>
                  <th scope="col" className="tdb-freq__nombre">Sorties</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((p) => (
                  <tr key={p.chemin}>
                    <th scope="row" className="tdb-freq__chemin">{p.chemin}</th>
                    <td className="tdb-freq__nombre">{formaterNombre(p.vues)}</td>
                    <td className="tdb-freq__nombre">{formaterNombre(p.visiteurs)}</td>
                    <td className="tdb-freq__nombre">{formaterNombre(p.entrees)}</td>
                    <td className="tdb-freq__nombre">{formaterNombre(p.sorties)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages.length > nombre && (
            <Bouton variante="secondaire" onClick={() => setNombre((n) => n + 20)}>
              Afficher {Math.min(20, pages.length - nombre)} de plus
            </Bouton>
          )}
        </>
      ) : (
        <p className="tdb-vide">Aucune page vue sur la période.</p>
      )}
    </section>
  );
};

const Actions = ({ actions }) => (
  <section className="tdb-freq__bloc">
    <h3 className="tdb-repartition__titre">Clics et actions</h3>
    {actions.length ? (
      <div className="tdb-freq__defilement">
        <table className="tdb-freq__table">
          <thead>
            <tr>
              <th scope="col">Action</th>
              <th scope="col">Lien</th>
              <th scope="col">Depuis</th>
              <th scope="col" className="tdb-freq__nombre">Clics</th>
            </tr>
          </thead>
          <tbody>
            {actions.slice(0, 12).map((a) => (
              <tr key={`${a.action}|${a.cible}|${a.libelle}`}>
                <td>{LIBELLES_ACTION[a.action] || a.action}</td>
                <td className="tdb-freq__chemin" title={a.cible}>{a.libelle || a.cible}</td>
                <td className="tdb-freq__chemin">{a.depuis}</td>
                <td className="tdb-freq__nombre">{formaterNombre(a.nombre)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="tdb-vide">Aucun clic sortant, e-mail ou téléchargement sur la période.</p>
    )}
  </section>
);

const Recentes = ({ recentes }) => (
  <section className="tdb-freq__bloc">
    <h3 className="tdb-repartition__titre">Dernières pages vues</h3>
    {recentes.length ? (
      <ol className="tdb-freq__recentes">
        {recentes.slice(0, 12).map((r, i) => (
          <li key={`${r.quand}-${i}`} className="tdb-freq__recente" style={{ '--i': i }}>
            <time dateTime={r.quand} title={formaterDateHeure(r.quand)}>{formaterIlYa(r.quand)}</time>
            <span className="tdb-freq__chemin">{r.chemin}</span>
            <span className="tdb-freq__meta">{[r.source || (r.source_type && r.source_type !== 'interne' && LIBELLES_CANAL[r.source_type]), LIBELLES_APPAREIL[r.appareil], r.navigateur, r.pays && nomPays(r.pays)].filter(Boolean).join(' · ')}</span>
          </li>
        ))}
      </ol>
    ) : (
      <p className="tdb-vide">Rien encore.</p>
    )}
  </section>
);

/** Statistiques du serveur (Awstats, o2switch) : tout ce que le serveur sert, robots compris. */
const Serveur = ({ serveur }) => {
  if (!serveur) return null;
  if (serveur.erreur) {
    return (
      <section className="tdb-freq__serveur">
        <h3 className="tdb-freq__sous-titre">Côté serveur · Awstats</h3>
        <p className="tdb-vide tdb-vide--erreur">{serveur.erreur}</p>
      </section>
    );
  }
  const c = serveur.courant;
  const pagesPays = c.pays.reduce((s, p) => s + p.pages, 0);
  return (
    <section className="tdb-freq__serveur">
      <div className="tdb-freq__serveur-tete">
        <h3 className="tdb-freq__sous-titre">Côté serveur · Awstats</h3>
        <p className="tdb-avis__meta">
          Mis à jour {formaterIlYa(serveur.misAJour)} · {serveur.note}
        </p>
      </div>
      <div className="tdb-chiffres">
        {[
          ['Visites ce mois', c.visites, 'vues du serveur, robots compris'],
          ['Visiteurs uniques', c.visiteurs, 'adresses distinctes ce mois'],
          ['Pages servies', c.pages, `${formaterNombre(c.hits)} requêtes · ${formaterOctets(c.octets)}`],
          ['Requêtes de robots', c.robotsHits, `${pluriel(c.robots.length, 'robot')} reconnu${c.robots.length > 1 ? 's' : ''}`],
        ].map(([libelle, valeur, contexte]) => (
          <div key={libelle} className="tdb-chiffres__bloc">
            <p className="tdb-chiffres__libelle">{libelle}</p>
            <p className="tdb-chiffres__valeur">{formaterNombre(valeur)}</p>
            <p className="tdb-chiffres__contexte">{contexte}</p>
          </div>
        ))}
      </div>
      <div className="tdb-freq__grille">
        <MiniBarres titre="Visites par mois (serveur)" elements={serveur.mois.slice(-12).map((m) => ({ cle: m.mois, libelle: formaterMois(m.mois), valeur: m.visites, axe: formaterMois(m.mois) }))} note={`Depuis ${formaterMois(serveur.mois[0].mois)} · ${formaterNombre(serveur.mois.reduce((s, m) => s + m.visites, 0))} visites en tout`} />
        <section className="tdb-repartition">
          <h3 className="tdb-repartition__titre">Robots et assistants IA</h3>
          {c.robots.length ? (
            <ol className="tdb-freq__robots">
              {c.robots.slice(0, 10).map((r) => (
                <li key={r.nom}>
                  <span>{r.nom}</span>
                  <span className="tdb-freq__nombre">{pluriel(r.hits, 'requête')}</span>
                  <span className="tdb-freq__meta">{r.derniere ? `dernier passage ${formaterIlYa(r.derniere)}` : ''}{r.robotsTxt ? ` · robots.txt lu ${r.robotsTxt} fois` : ''}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="tdb-vide">Aucun robot reconnu ce mois.</p>
          )}
        </section>
        <Barres titre="Pays (serveur)" elements={c.pays.slice(0, 8).map((p) => ({ cle: p.code, libelle: nomPays(p.code) || p.code, valeur: p.pages }))} total={pagesPays} />
        <Barres titre="Origine des pages servies" elements={Object.entries(c.origines).filter(([, v]) => v.pages > 0).map(([cle, v]) => ({ cle, libelle: LIBELLES_ORIGINE[cle] || cle, valeur: v.pages }))} />
        <Barres titre="Pages les plus demandées (serveur)" code elements={c.pagesServeur.slice(0, 8).map((p) => ({ cle: p.url, libelle: p.url, valeur: p.pages, detail: p.entrees ? `${formaterNombre(p.entrees)} entrées` : '' }))} />
        {c.referents.length > 0 && <Barres titre="Sites référents (serveur)" code elements={c.referents.slice(0, 6).map((r) => ({ cle: r.url, libelle: r.url.replace(/^https?:\/\/(www\.)?/, ''), titre: r.url, valeur: r.pages }))} />}
        {c.recherches.length > 0 && <Barres titre="Recherches" elements={c.recherches.slice(0, 6).map((r) => ({ cle: r.phrase, libelle: r.phrase, valeur: r.nombre }))} />}
        <section className="tdb-repartition">
          <h3 className="tdb-repartition__titre">Scans et erreurs 404</h3>
          <p className="tdb-freq__note">
            {c.erreurs404.total ? `${formaterNombre(c.erreurs404.total)} requêtes vers des adresses inexistantes ce mois (sondes WordPress, .env…), sans suite.` : 'Aucune adresse inexistante demandée ce mois.'}
          </p>
          {c.erreurs404.urls.length > 0 && (
            <ol className="tdb-freq__robots">
              {c.erreurs404.urls.slice(0, 4).map((u) => (
                <li key={u.url}>
                  <span className="tdb-freq__chemin">{u.url}</span>
                  <span className="tdb-freq__nombre">{formaterNombre(u.hits)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </section>
  );
};

/** `rendezVous` : { depuis } quand le site compte sa prise de rendez-vous (praticien), sinon absent. */
export default function Frequentation({ slug, appeler, onSessionExpiree, rendezVous = null }) {
  const [periode, setPeriode] = useState('30');
  const [avecEquipe, setAvecEquipe] = useState(false);
  const [exclu, setExclu] = useState(lireExclusion);
  const { donnees, chargement } = useTrafic(appeler, slug, periode, avecEquipe, onSessionExpiree);
  const direct = useEnDirect(appeler, slug, onSessionExpiree);

  const basculerExclusion = (valeur) => {
    setExclu(valeur);
    try {
      if (valeur) localStorage.setItem(CLE_EXCLUSION, '1');
      else localStorage.removeItem(CLE_EXCLUSION);
    } catch {
      /* stockage indisponible : l'interrupteur reste visuel */
    }
  };

  if (donnees === null) return <p className="tdb-vide">Lecture de la fréquentation…</p>;
  if (donnees === 'erreur') return <p className="tdb-vide tdb-vide--erreur">Fréquentation momentanément illisible.</p>;
  if (donnees.nonBranche) return <SourceNonBranchee>Visites, pages vues et sources s’afficheront quand la mesure de fréquentation du site sera installée sur son PocketBase.</SourceNonBranchee>;
  if (donnees.erreur) return <p className="tdb-vide tdb-vide--erreur">{donnees.erreur}</p>;

  const m = donnees.mesure;
  const t = m.totaux;
  const cmp = m.comparaison;
  const infoPeriode = PERIODES.find((p) => p.cle === periode) || PERIODES[2];
  const avant = (valeur, texte) => (valeur ? `${texte} ${infoPeriode.avant}` : `rien ${infoPeriode.avant}`);
  const tuiles = [
    ['Visites', t.visites, null, avant(cmp.visites, formaterNombre(cmp.visites)), cmp.evolution.visites, false],
    ['Visiteurs', t.visiteurs, null, avant(cmp.visiteurs, formaterNombre(cmp.visiteurs)), cmp.evolution.visiteurs, false],
    ['Pages vues', t.pagesVues, null, avant(cmp.pagesVues, formaterNombre(cmp.pagesVues)), cmp.evolution.pagesVues, false],
    ['Pages par visite', t.pagesParVisite, formaterDecimal(t.pagesParVisite), avant(cmp.pagesParVisite, formaterDecimal(cmp.pagesParVisite)), cmp.evolution.pagesParVisite, false],
    ['Durée moyenne', t.duree, formaterDuree(t.duree), 'visites de plusieurs pages', cmp.evolution.duree, false],
    ['Rebond', t.rebond, `${Math.round(t.rebond * 100)} %`, 'une seule page vue', cmp.evolution.rebond, true],
  ];
  const collecte = donnees.collecte;
  const absents = m.absents || [];
  // Site hébergé dont rien n'est jamais arrivé (ni cette période, ni la précédente, ni de ma part) : sa balise n'est
  // pas en ligne, ou sa politique de sécurité bloque l'envoi. Le dire vaut mieux qu'un tableau de zéros.
  // Seulement sur les longues périodes (60 jours lus au moins) : un jour ou une semaine sans visite n'est pas une panne.
  if (donnees.heberge && (periode === '30' || periode === '90') && !t.pagesVues && !cmp.pagesVues && !m.duBureau) {
    return (
      <SourceNonBranchee titre="Aucune mesure reçue">
        Ce site n’a encore envoyé aucune page vue. Sa balise de mesure n’est pas en ligne, ou sa politique de sécurité (CSP, connect-src) n’autorise pas https://api.axelgregoire.fr. Les chiffres
        s’afficheront dès sa prochaine publication.
      </SourceNonBranchee>
    );
  }
  const enDirect = direct && direct !== 'erreur' && !direct.erreur ? direct : null;

  return (
    <div className={`tdb-freq${chargement ? ' tdb-freq--chargement' : ''}`}>
      <div className="tdb-freq__tete">
        <p className="tdb-freq__direct" aria-live="polite">
          <Pastille etat={enDirect && enDirect.visiteurs > 0 ? 'en-ligne' : 'inconnu'} onde={Boolean(enDirect && enDirect.visiteurs > 0)} />
          <span>
            {direct === null && 'En ce moment…'}
            {direct === 'erreur' && 'En direct indisponible'}
            {direct && direct !== 'erreur' && direct.erreur && direct.erreur}
            {enDirect && (
              <>
                <strong>{formaterNombre(enDirect.visiteurs)}</strong> {enDirect.visiteurs > 1 ? 'visiteurs' : 'visiteur'} en ce moment
                {enDirect.pages?.length > 0 && <span className="tdb-freq__meta"> · {enDirect.pages.map((p) => p.chemin).join(', ')}</span>}
              </>
            )}
          </span>
        </p>
        <Onglets libelle="Période" className="tdb-freq__periodes" elements={PERIODES} actif={periode} onChoisir={setPeriode} />
      </div>

      <div className="tdb-chiffres tdb-freq__chiffres">
        {tuiles.map(([libelle, valeur, affichage, contexte, evo, inverse], i) => (
          <div key={libelle} className="tdb-chiffres__bloc">
            <p className="tdb-chiffres__libelle">{libelle}</p>
            <p className="tdb-chiffres__valeur">{affichage ?? <Compteur valeur={valeur} delai={i * 60} />}</p>
            <p className="tdb-chiffres__contexte">
              <Evolution evo={evo} inverse={inverse} />
              <span>{contexte}</span>
            </p>
          </div>
        ))}
      </div>

      <GraphiqueJours parJour={m.parJour} />

      {rendezVous && m.rendezVous && <RendezVous r={m.rendezVous} depuis={rendezVous.depuis} />}

      <div className="tdb-freq__grille">
        <Barres titre="D’où viennent les visites" total={t.visites} elements={m.sources.map((s) => ({ cle: s.type, libelle: s.libelle, valeur: s.nombre, detail: s.noms.slice(0, 3).map((n) => `${n.nom} ${formaterNombre(n.nombre)}`).join(', ') }))} />
        {!absents.includes('pays') && <Barres titre="Pays" total={t.visites} elements={m.pays.slice(0, 8).map((p) => ({ cle: p.code || 'inconnu', libelle: p.code ? nomPays(p.code) || p.code : 'Pays inconnu', valeur: p.nombre }))} />}
        <Barres titre="Appareils" total={t.visites} elements={m.appareils.map((a) => ({ cle: a.appareil, libelle: LIBELLES_APPAREIL[a.appareil] || a.appareil, valeur: a.nombre }))} />
        {!absents.includes('navigateur') && <Barres titre="Navigateurs" total={t.visites} elements={m.navigateurs.slice(0, 8).map((n) => ({ cle: n.nom, libelle: n.nom, valeur: n.nombre }))} />}
        {!absents.includes('systeme') && <Barres titre="Systèmes" total={t.visites} elements={m.systemes.slice(0, 8).map((s) => ({ cle: s.nom, libelle: s.nom, valeur: s.nombre }))} />}
        {m.langues.length > 0 && <Barres titre="Langues du navigateur" total={t.visites} elements={m.langues.slice(0, 6).map((l) => ({ cle: l.code, libelle: l.code.toUpperCase(), valeur: l.nombre }))} />}
        {m.campagnes.length > 0 && <Barres titre="Campagnes (utm_campaign)" total={t.visites} elements={m.campagnes.slice(0, 6).map((c) => ({ cle: c.nom, libelle: c.nom, valeur: c.nombre }))} />}
        <MiniBarres titre="Heures de visite" elements={m.heures.map((h) => ({ cle: h.heure, libelle: `${h.heure} h`, valeur: h.nombre, axe: h.heure % 6 === 0 ? `${h.heure} h` : '' }))} />
        <MiniBarres titre="Jours de la semaine" elements={m.semaine.map((j, i) => ({ cle: j.nom, libelle: j.nom, valeur: j.nombre, axe: JOURS_COURTS[i] }))} />
      </div>

      <div className="tdb-freq__grille tdb-freq__grille--large">
        <TablePages pages={m.pages} />
        <Actions actions={m.actions} />
        <Recentes recentes={m.recentes} />
      </div>

      <Serveur serveur={donnees.serveur} />

      <div className="tdb-freq__pied">
        {/* L'interrupteur pose un drapeau lu par le site du tableau de bord lui-même : sans effet sur un autre site. */}
        {donnees.exclusionLocale && (
          <div className="tdb-freq__exclusion">
            <InterrupteurGlissant actif={exclu} onChangement={basculerExclusion} libelle="Ne pas compter mes visites depuis cet appareil" />
            <span>Ne pas compter mes visites depuis cet appareil</span>
          </div>
        )}
        {m.duBureau > 0 && (
          <p className="tdb-avis__meta">
            {pagesVuesTexte(m.duBureau)} de ma part sur la période, {avecEquipe ? 'comptées' : 'exclues'} ·{' '}
            <button type="button" className="tdb-freq__lien" onClick={() => setAvecEquipe((v) => !v)}>
              {avecEquipe ? 'les exclure' : 'les inclure'}
            </button>
          </p>
        )}
        <p className="tdb-avis__meta">
          Mesure maison sans cookie, robots exclus
          {donnees.heberge ? ', hébergée dans le PocketBase du portfolio' : ''}
          {!collecte ? ', lue dans le PocketBase du site' : ''}
          {absents.length > 0 && ` · ce site ne mesure pas : ${absents.map((a) => ({ pays: 'le pays', navigateur: 'le navigateur', systeme: 'le système' })[a]).join(', ')}`}
          {collecte && !absents.includes('pays') && (
            <>
              {' '}
              ·{' '}
              {donnees.geo?.branche ? (
                <>
                  pays par <a className="tdb-freq__lien" href="https://db-ip.com" target="_blank" rel="noreferrer">IP Geolocation by DB-IP</a> (édition {donnees.geo.edition})
                </>
              ) : (
                'pays non renseigné (base géo absente du serveur)'
              )}
            </>
          )}
          {collecte && (
            <>
              {' '}
              · depuis le démarrage de l’API : {formaterNombre(collecte.recues || 0)} reçues, {formaterNombre(collecte.ecrites || 0)} écrites, {formaterNombre(collecte.ecartees || 0)} écartées
              {collecte.echecs ? `, ${formaterNombre(collecte.echecs)} échecs (${collecte.derniereErreur})` : ''}
            </>
          )}{' '}
          · lu à {formaterHeure(donnees.verifieLe)}
          {donnees.tronque ? ' · lecture tronquée à 40 000 lignes' : ''}
        </p>
      </div>
    </div>
  );
}
