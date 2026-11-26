import React, { useEffect, useState } from 'react';
import { LogoProjet } from '../composants/CarteProjet';
import Courbe from '../composants/Courbe';
import { FormulaireDocument, ListeDocuments } from '../composants/Documents';
import { ListeMembres, TotauxMembres, TraficSite, UsageProjet } from '../composants/DonneesPocketbase';
import Frequentation from '../composants/Frequentation';
import Icone from '../composants/Icone';
import SiteJournaux from '../composants/SiteJournaux';
import { Badge, BlocCommande, Bouton, LienConsole, LigneActivite, Onglets, Panneau, Pastille, SourceNonBranchee } from '../composants/elements';
import { CHEMINS } from '../constantes';
import { useSource } from '../sources';
import { CATEGORIES_COMMANDES, coutsDuProjet, decrireCible, decrireEcheance, etatCi, etatEcheance, etatVersion, formaterDateLongue, formaterIlYa, formaterJourMois, formaterNombre, formaterTaux, mouvementReduit, nomPays, PLATEFORMES, statutExpo, STORES, formaterEuros, formaterHeure, hote, ICONES_LIENS, PASTILLE_SANTE, PERIODICITES, STATUTS, TYPES } from '../outils';

// Onglets de la fiche, sur téléphone seulement (décision du 10/10) : sur ordinateur, tout tient sur une page.
const ONGLETS = [
  { cle: 'apercu', libelle: 'Aperçu' },
  { cle: 'liens', libelle: 'Liens' },
  { cle: 'documents', libelle: 'Documents' },
  { cle: 'commandes', libelle: 'Commandes' },
  { cle: 'couts', libelle: 'Coûts' },
];
// Projet doté d'un PocketBase : onglet « Membres » en deuxième position.
const ONGLETS_AVEC_MEMBRES = [ONGLETS[0], { cle: 'membres', libelle: 'Membres' }, ...ONGLETS.slice(1)];
const TON_STATUT = { production: 'en-ligne', developpement: 'accent', pause: 'alerte', abandonne: 'neutre' };

/** Texte affichable quelle que soit la forme saisie dans l'inventaire (texte, liste ou objet). */
const enTexte = (v) => (v == null ? '' : Array.isArray(v) ? v.map(enTexte).filter(Boolean).join(', ') : typeof v === 'object' ? Object.values(v).map(enTexte).filter(Boolean).join(' · ') : String(v));

/** Identifiants techniques à afficher, dans l'ordre, sans les champs vides. */
function lignesIdentifiants(id = {}) {
  const lignes = [
    ['Bundle iOS', id.bundleIos],
    ['Package Android', id.packageAndroid],
    ['App Store ID', id.appStoreId],
    ['Projet EAS', id.eas && `${id.eas.proprietaire}/${id.eas.slug}`],
    ['PocketBase', id.pocketbase],
    ['Koyeb', id.koyeb && [id.koyeb.app, id.koyeb.service, id.koyeb.serviceBot]],
    ['Vercel', id.vercel && [id.vercel.projet, id.vercel.url]],
    ['Site', id.site || (id.siteSuppose && `${id.siteSuppose} (supposé)`)],
    ['Hébergement du site', id.hebergementSite],
    ['Fréquentation du site', id.journaux && 'journaux du serveur, sans rien dans les pages'],
    ['Mesure d’audience', id.analytics && [id.analytics.detail, id.analytics.idMesure]],
    ['Achats intégrés', id.achatsIntegres],
    ['Dépôts annexes', id.depotsAnnexes],
  ];
  return lignes.map(([cle, v]) => [cle, enTexte(v)]).filter(([, v]) => v);
}

const nomCourt = (libelle) => libelle.split(' — ')[0];

/** Un dépôt GitHub : visibilité, dernier push, dernière CI et derniers commits. */
const Depot = ({ depot }) => {
  if (depot.erreur) {
    return (
      <div className="tdb-depot">
        <p className="tdb-depot__nom">{depot.nom}</p>
        <p className="tdb-vide">{depot.erreur}</p>
      </div>
    );
  }
  const ci = depot.ci && etatCi(depot.ci);
  return (
    <div className="tdb-depot">
      <p className="tdb-depot__tete">
        <a className="tdb-depot__nom" href={depot.url} target="_blank" rel="noopener noreferrer">
          <Icone nom="terminal" taille={16} />
          {depot.nom}
        </a>
        <Badge>{depot.prive ? 'Privé' : 'Public'}</Badge>
      </p>
      <p className="tdb-depot__meta">
        Branche {depot.branche} · dernier push {formaterIlYa(depot.dernierPush)}
        {depot.archive && ' · archivé'}
      </p>
      {ci && (
        <a className="tdb-depot__ci" href={depot.ci.url} target="_blank" rel="noopener noreferrer">
          <Pastille etat={ci.pastille} />
          CI « {depot.ci.nom} » {ci.libelle} · {formaterIlYa(depot.ci.date)}
        </a>
      )}
      <ul className="tdb-depot__commits">
        {depot.commits.map((c) => (
          <li key={c.sha}>
            <a href={c.url} target="_blank" rel="noopener noreferrer" className="tdb-depot__message">
              {c.message}
            </a>
            <span className="tdb-depot__quand">
              <code>{c.sha}</code> · {formaterIlYa(c.date)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/** Builds, envois vers les stores et mises à jour OTA d'une application (Expo). */
const BuildsExpo = ({ app }) => {
  if (app.erreur) return <p className="tdb-vide tdb-vide--erreur">{app.erreur}</p>;
  return (
    <div className="tdb-expo">
      <h3 className="tdb-expo__titre">Builds</h3>
      {app.builds.length ? (
        <ul className="tdb-liste">
          {app.builds.map((b) => (
            <LigneActivite
              key={b.id}
              icone="fusee"
              etat={statutExpo(b.statut).etat}
              texte={`${PLATEFORMES[b.plateforme]} ${b.version} (${b.numero}) · ${b.profil}`}
              lien={b.url}
              detail={b.erreur ? `${statutExpo(b.statut).libelle} · ${b.erreur}` : `${statutExpo(b.statut).libelle}${b.message ? ` · ${b.message}` : ''}`}
              temps={formaterIlYa(b.date)}
            />
          ))}
        </ul>
      ) : (
        <p className="tdb-vide">Aucun build.</p>
      )}
      <h3 className="tdb-expo__titre">Envois vers les stores</h3>
      {app.envois.length ? (
        <ul className="tdb-liste">
          {app.envois.map((e) => (
            <LigneActivite
              key={e.id}
              icone="telechargement"
              etat={statutExpo(e.statut).etat}
              texte={`${STORES[e.plateforme]}${e.version ? ` · ${e.version} (${e.numero})` : ''}`}
              lien={e.url}
              detail={e.erreur ? `${statutExpo(e.statut).libelle} · ${e.erreur}` : statutExpo(e.statut).libelle}
              temps={formaterIlYa(e.date)}
            />
          ))}
        </ul>
      ) : (
        <p className="tdb-vide">Aucun envoi.</p>
      )}
      <h3 className="tdb-expo__titre">Mises à jour OTA</h3>
      {app.misesAJour.length ? (
        <ul className="tdb-liste">
          {app.misesAJour.map((u) => (
            <LigneActivite key={u.url} icone="activite" texte={u.message ? `« ${u.message} »` : 'Mise à jour'} lien={u.url} detail={`branche ${u.branche}${u.runtime ? ` · runtime ${u.runtime}` : ''}`} temps={formaterIlYa(u.date)} />
          ))}
        </ul>
      ) : (
        <p className="tdb-vide">Aucune mise à jour OTA publiée.</p>
      )}
    </div>
  );
};

/** Avis d'un store : étoiles, texte, auteur, version, date. */
const ListeAvis = ({ avis }) => (
  <ul className="tdb-avis">
    {avis.slice(0, 3).map((a) => (
      <li key={`${a.auteur}-${a.date}`} className="tdb-avis__item">
        <p className="tdb-avis__tete">
          <span className="tdb-avis__etoiles" aria-label={`${a.note} sur 5`}>
            {'★'.repeat(a.note || 0)}
            <span aria-hidden="true">{'★'.repeat(5 - (a.note || 0))}</span>
          </span>
          {a.titre && <span className="tdb-avis__titre">{a.titre}</span>}
        </p>
        {a.texte && <p className="tdb-avis__texte">{a.texte}</p>}
        <p className="tdb-avis__meta">
          {a.auteur || 'Anonyme'}
          {a.version && ` · version ${a.version}`}
          {a.date && ` · ${formaterJourMois(a.date)}`}
        </p>
      </li>
    ))}
  </ul>
);

const compter = (n, un, plusieurs = `${un}s`) => `${formaterNombre(n)} ${n > 1 ? plusieurs : un}`;
/** Détail d'un jour dans la bulle d'une courbe : les mesures non nulles, séparées par des points médians. */
const detailJour = (...mesures) => mesures.filter(([n]) => n > 0).map(([n, un, plusieurs]) => compter(n, un, plusieurs)).join(' · ') || null;

/** Tuiles de chiffres d'une source : [libellé, valeur, contexte]. */
const Chiffres = ({ lignes }) => (
  <div className="tdb-chiffres">
    {lignes.map(([libelle, valeur, contexte]) => (
      <div key={libelle} className="tdb-chiffres__bloc">
        <p className="tdb-chiffres__libelle">{libelle}</p>
        <p className="tdb-chiffres__valeur">{valeur}</p>
        <p className="tdb-chiffres__contexte">{contexte}</p>
      </div>
    ))}
  </div>
);

/**
 * Fiche d'une app dans son store : combien de personnes l'ont vue, jour par jour, et d'où elles venaient.
 * `mesure` : la série tracée ; `autre` : la seconde mesure du jour, donnée dans la bulle.
 */
const FicheStore = ({ titre, chiffres, jours, mesure, autre, sources, note }) => (
  <section className="tdb-sous-section">
    <h3 className="tdb-sous-section__titre">{titre}</h3>
    <Chiffres lignes={chiffres} />
    {jours.length > 1 && (
      <figure className="tdb-ios__courbe">
        <Courbe
          points={jours.map((j) => ({ jour: j.date, valeur: j[mesure.cle], detail: detailJour([j[autre.cle], autre.un, autre.plusieurs]) }))}
          unite={[mesure.un, mesure.plusieurs]}
          libelle={`${mesure.titre} par jour du ${formaterJourMois(jours[0].date)} au ${formaterJourMois(jours.at(-1).date)}`}
        />
        <figcaption>
          {mesure.titre} par jour · du {formaterJourMois(jours[0].date)} au {formaterJourMois(jours.at(-1).date)}
        </figcaption>
      </figure>
    )}
    {sources.length > 0 && (
      <p className="tdb-ios__pays">
        <span className="tdb-chiffres__libelle">D’où viennent-ils</span>
        {sources.join(' · ')}
      </p>
    )}
    {note && <p className="tdb-avis__meta">{note}</p>}
  </section>
);

/** App Store : chiffres sur 30 jours, courbe des téléchargements, versions, note et derniers avis. */
const AppStoreIos = ({ app, periode }) => {
  const { total, hier, jours, depuisLancement, pays } = app.ventes;
  const derniere = app.derniereVersion && etatVersion(app.derniereVersion.etat);
  const chiffres = [
    ['Téléchargements · 30 j', total.telechargements, `${hier?.telechargements ?? 0} hier · + ${total.retelechargements} réinstallations`],
    ['Depuis le lancement', depuisLancement.telechargements, `+ ${depuisLancement.retelechargements} réinstallations · ${depuisLancement.misesAJour} mises à jour`],
    ['Note', app.note?.nombre ? app.note.moyenne.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : '—', app.note?.nombre ? `${app.note.nombre} note${app.note.nombre > 1 ? 's' : ''} · France` : 'aucune note en France'],
  ];
  if (total.achats || total.revenusEuros) chiffres.push(['Revenus', formaterEuros(total.revenusEuros, { centimes: true }), `${total.achats} achat${total.achats > 1 ? 's' : ''} intégré${total.achats > 1 ? 's' : ''}`]);
  return (
    <div className="tdb-ios">
      <Chiffres lignes={chiffres} />
      <figure className="tdb-ios__courbe">
        <Courbe
          points={jours.map((j) => ({
            jour: j.date,
            valeur: j.telechargements,
            absent: j.illisible,
            detail: detailJour([j.retelechargements, 'réinstallation'], [j.misesAJour, 'mise à jour', 'mises à jour'], [j.achats, 'achat intégré', 'achats intégrés']),
          }))}
          unite={['téléchargement', 'téléchargements']}
          libelle={`Téléchargements par jour du ${formaterJourMois(periode.du)} au ${formaterJourMois(periode.au)}`}
        />
        <figcaption>
          Téléchargements par jour · du {formaterJourMois(periode.du)} au {formaterJourMois(periode.au)}
        </figcaption>
      </figure>
      {pays.length > 0 && (
        <p className="tdb-ios__pays">
          <span className="tdb-chiffres__libelle">Pays · 30 j</span>
          {pays.map((p) => `${nomPays(p.code)} ${p.telechargements}`).join(' · ')}
        </p>
      )}
      <p className="tdb-ios__version">
        <Pastille etat={derniere ? derniere.etat : 'inconnu'} />
        {app.versionEnLigne ? `En ligne : ${app.versionEnLigne}` : 'Jamais publiée sur l’App Store'}
        {app.derniereVersion && app.derniereVersion.version !== app.versionEnLigne && ` · ${app.derniereVersion.version} ${derniere.libelle}`}
      </p>
      {app.avis.length > 0 && <ListeAvis avis={app.avis} />}
      {app.fiche && (
        <FicheStore
          titre="Fiche de l’App Store"
          chiffres={[
            ['Vues de la fiche · 30 j', formaterNombre(app.fiche.total.vues), 'pages de l’app ouvertes dans l’App Store'],
            ['Impressions · 30 j', formaterNombre(app.fiche.total.impressions), 'apparitions dans la recherche et les sélections'],
          ]}
          jours={app.fiche.jours}
          mesure={{ cle: 'vues', titre: 'Vues de la fiche', un: 'vue de la fiche', plusieurs: 'vues de la fiche' }}
          autre={{ cle: 'impressions', un: 'impression' }}
          sources={app.fiche.sources.map((s) => `${s.nom} ${formaterNombre(s.vues)}`)}
          note="Apple ne compte que les personnes qui partagent leurs données avec les développeurs et masque les très petits nombres : ces chiffres sont partiels."
        />
      )}
      {!app.fiche && app.versionEnLigne && <p className="tdb-avis__meta">Vues de la fiche : Apple n’a pas de rapport ouvert pour cette app.</p>}
    </div>
  );
};

/** Google Play : installations, appareils actifs, note, qualité (Vitals) et derniers avis. */
const GooglePlayAndroid = ({ app }) => {
  if (app.absente) return <p className="tdb-vide">Pas encore créée sur Google Play.</p>;
  const { installations, note, qualite, avis } = app;
  const qualiteTexte = (cle, libelle) => {
    const q = qualite[cle];
    if (q.taux == null) return `${libelle} : Google ne publie pas encore de taux (trop peu d’utilisateurs)`;
    return `${libelle} : ${formaterTaux(q.taux)} sur 28 jours (seuil Google ${formaterTaux(q.seuil)})`;
  };
  return (
    <div className="tdb-ios">
      {app.rapports === 'en-attente' && (
        <p className="tdb-vide">Google ouvre l’accès aux rapports de la Play Console (jusqu’à 24 h après l’invitation). Installations et note s’afficheront ensuite, sans rien faire de ton côté.</p>
      )}
      {app.rapports === 'ok' && (
        <>
          <Chiffres
            lignes={[
              ['Installations · 30 j', installations.total.installations, `${installations.hier?.installations ?? 0} le ${installations.hier ? formaterJourMois(installations.hier.date) : '—'} · ${installations.total.desinstallations} désinstallations`],
              ['Installée chez', installations.actifs ?? '—', installations.cumul != null ? `${installations.cumul} utilisateurs au total` : 'appareils actifs'],
              ['Note', note?.moyenne ? note.moyenne.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : '—', note?.moyenne ? 'moyenne Google Play' : 'aucune note'],
            ]}
          />
          {installations.jours.length > 1 && (
            <figure className="tdb-ios__courbe">
              <Courbe
                points={installations.jours.map((j) => ({ jour: j.date, valeur: j.installations, detail: detailJour([j.desinstallations, 'désinstallation'], [j.misesAJour, 'mise à jour', 'mises à jour']) }))}
                unite={['installation', 'installations']}
                libelle={`Installations Android par jour du ${formaterJourMois(installations.jours[0].date)} au ${formaterJourMois(installations.jours.at(-1).date)}`}
              />
              <figcaption>
                Installations par jour · du {formaterJourMois(installations.jours[0].date)} au {formaterJourMois(installations.jours.at(-1).date)}
              </figcaption>
            </figure>
          )}
        </>
      )}
      <p className="tdb-ios__version">
        <Pastille etat={[qualite.plantages, qualite.anr].some((q) => q.taux != null && q.taux > q.seuil) ? 'panne' : [qualite.plantages, qualite.anr].every((q) => q.taux == null) ? 'inconnu' : 'en-ligne'} />
        Qualité Android (Vitals)
      </p>
      <p className="tdb-avis__meta">{qualiteTexte('plantages', 'Plantages')}</p>
      <p className="tdb-avis__meta">{qualiteTexte('anr', 'Blocages (ANR)')}</p>
      {avis === null && <p className="tdb-vide">Avis illisibles : l’API Android Publisher n’est pas activée dans le projet Google Cloud.</p>}
      {avis?.length === 0 && <p className="tdb-vide">Aucun avis ces 7 derniers jours.</p>}
      {avis?.length > 0 && <ListeAvis avis={avis} />}
      {app.fiche && (
        <FicheStore
          titre="Fiche Google Play"
          chiffres={[
            ['Visiteurs de la fiche', formaterNombre(app.fiche.total.visiteurs), `du ${formaterJourMois(app.fiche.jours[0].date)} au ${formaterJourMois(app.fiche.jours.at(-1).date)}`],
            ['Installations depuis la fiche', formaterNombre(app.fiche.total.acquisitions), 'visiteurs qui ont installé l’app'],
            ['Conversion', app.fiche.total.visiteurs ? formaterTaux(app.fiche.total.acquisitions / app.fiche.total.visiteurs) : '—', 'installations pour 100 visiteurs'],
          ]}
          jours={app.fiche.jours}
          mesure={{ cle: 'visiteurs', titre: 'Visiteurs de la fiche', un: 'visiteur', plusieurs: 'visiteurs' }}
          autre={{ cle: 'acquisitions', un: 'installation' }}
          // Une seule source « Autres » : Google ne détaille pas les petits nombres, rien à montrer.
          sources={app.fiche.sources.length > 1 ? app.fiche.sources.map((s) => `${s.nom} ${formaterNombre(s.visiteurs)}`) : []}
          note="Rapport « Performances de la fiche » de la Play Console, publié par Google avec quelques jours de décalage."
        />
      )}
    </div>
  );
};

const ETAT_LIGNE = { 'en-ligne': 'en-ligne', surveiller: 'alerte', alerte: 'alerte', panne: 'panne' };

/**
 * Santé d'un site sur son propre domaine : réponse en direct, puis quand expirent son certificat et son nom de domaine.
 * Une source illisible est dite telle quelle ; un domaine non déposé (adresse seulement supposée) aussi.
 */
const SanteSite = ({ sante, domaine, verifieLe }) => {
  const site = sante?.cibles.find((c) => c.type === 'site');
  const { certificat, enregistrement } = domaine;
  return (
    <>
      <ul className="tdb-liste">
        {site && <LigneActivite icone="activite" etat={PASTILLE_SANTE[site.etat] === 'inconnu' ? undefined : PASTILLE_SANTE[site.etat]} texte={decrireCible(site)} detail={hote(site.url)} temps="en direct" />}
        {certificat && !certificat.erreur && (
          <LigneActivite
            icone="bouclier"
            etat={ETAT_LIGNE[etatEcheance('certificat', certificat.dansJours)]}
            texte={`Certificat : ${decrireEcheance(certificat.dansJours)}`}
            detail={`${certificat.emetteur || 'émetteur inconnu'} · renouvelé par l’hébergeur`}
            temps={formaterDateLongue(certificat.expireLe)}
          />
        )}
        {certificat?.erreur && <LigneActivite icone="bouclier" texte="Certificat illisible" detail={certificat.erreur} />}
        {enregistrement.expireLe && (
          <LigneActivite
            icone="site"
            etat={ETAT_LIGNE[etatEcheance('domaine', enregistrement.dansJours)]}
            texte={`Nom de domaine : ${decrireEcheance(enregistrement.dansJours)}`}
            detail={`${domaine.domaine}${enregistrement.bureau ? ` · ${enregistrement.bureau}` : ''}`}
            temps={formaterDateLongue(enregistrement.expireLe)}
          />
        )}
        {enregistrement.nonDepose && <LigneActivite icone="site" etat="alerte" texte="Nom de domaine non déposé" detail={`${domaine.domaine} est libre : l’adresse du site n’est que supposée`} />}
        {enregistrement.erreur && <LigneActivite icone="site" texte="Nom de domaine illisible" detail={enregistrement.erreur} />}
      </ul>
      <p className="tdb-avis__meta">Certificat lu sur le site, domaine lu au registre public · vérifié à {formaterHeure(verifieLe)}</p>
    </>
  );
};

/**
 * Documents du projet : contrats rangés dans ce projet (signés ou en attente de signature) et documents déposés
 * (factures, devis, autres). Le bouton « Ajouter » dépose un fichier directement dans ce projet.
 */
const DocumentsProjet = ({ projet, coffre, projets, appeler, onChangement, onSessionExpiree, naviguer }) => {
  const [ajout, setAjout] = useState(false);
  const lu = coffre && coffre !== 'erreur' ? coffre : null;
  const documents = lu ? lu.documents.filter((d) => d.projet === projet.slug) : [];
  return (
    <Panneau
      titre="Documents"
      compteur={lu ? documents.length : undefined}
      className="tdb-fiche__documents"
      i={3}
      action={
        lu && !ajout ? (
          <Bouton variante="fantome" icone="plus" onClick={() => setAjout(true)}>
            Ajouter
          </Bouton>
        ) : null
      }
    >
      {ajout && (
        <FormulaireDocument
          appeler={appeler}
          projets={projets}
          projetImpose={projet.slug}
          onSessionExpiree={onSessionExpiree}
          onAnnuler={() => setAjout(false)}
          onEnregistre={() => {
            setAjout(false);
            onChangement();
          }}
        />
      )}
      {coffre === null && <p className="tdb-vide">Lecture du coffre…</p>}
      {coffre === 'erreur' && <p className="tdb-vide tdb-vide--erreur">Coffre momentanément illisible.</p>}
      {lu && documents.length > 0 && <ListeDocuments documents={documents} projets={projets} appeler={appeler} onChangement={onChangement} onSessionExpiree={onSessionExpiree} naviguer={naviguer} montrerProjet={false} />}
      {lu && documents.length === 0 && !ajout && <p className="tdb-vide">Aucun document rangé dans ce projet. Un contrat s’y classe depuis l’écran Signatures, dès son envoi ; une facture ou un devis se dépose avec « Ajouter ».</p>}
    </Panneau>
  );
};

/** Fiche projet (maquette « Fiche projet / bureau » et « / mobile »). */
const FicheProjet = ({ projet, couts, disponibilite, domaines, activite, builds, stores, sites, pocketbase, coffre, projets, onCoffreChange, naviguer, appeler, onSessionExpiree, onRetour }) => {
  const [onglet, setOnglet] = useState('apercu');
  // Module « tableau de bord » du PocketBase du projet : totaux et trafic (résumé), puis la liste des membres,
  // demandée à l'ouverture de la fiche seulement (données personnelles, jamais gardées dans le navigateur).
  const pb = pocketbase && pocketbase !== 'erreur' ? pocketbase : null;
  const donneesPb = projet && pb?.branche ? pb.projets[projet.slug] || null : null;
  const moduleLu = Boolean(donneesPb && !donneesPb.erreur);
  // Seulement pour un projet qui a son propre PocketBase : un site dont la mesure est hébergée ailleurs (Runes) a un
  // trafic dans le résumé, mais aucun membre à lister (la demande répondait 404 à chaque ouverture de sa fiche).
  const membres = useSource(appeler, `/pocketbase/${projet?.slug}/membres`, { actif: moduleLu && Boolean(projet?.identifiants?.pocketbase), declencheur: projet?.slug, fraicheurMs: 2 * 60_000, onSessionExpiree });

  // Motion v2 : les panneaux hors de l'écran à l'ouverture jouent leur montée quand on les fait défiler (ou quand
  // un onglet mobile les affiche) ; ceux déjà visibles gardent leur entrée minutée.
  useEffect(() => {
    if (!projet || mouvementReduit() || typeof IntersectionObserver === 'undefined') return undefined;
    const vus = new Set();
    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const { target, isIntersecting } of entrees) {
          if (!vus.has(target)) {
            vus.add(target);
            if (isIntersecting) observateur.unobserve(target);
            else target.classList.add('tdb-hors-ecran');
          } else if (isIntersecting) {
            target.classList.replace('tdb-hors-ecran', 'tdb-revele-defilement');
            observateur.unobserve(target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    document.querySelectorAll('.tdb-fiche .tdb-panneau').forEach((n) => observateur.observe(n));
    return () => observateur.disconnect();
  }, [projet]);

  if (!projet) {
    return (
      <div className="tdb-ecran tdb-fiche">
        <Panneau titre="Projet introuvable">
          <p className="tdb-vide">Ce projet n’existe pas, ou plus, dans l’inventaire.</p>
          <a className="tdb-bouton tdb-bouton--secondaire" href={CHEMINS.vue} onClick={onRetour}>
            <Icone nom="retour" taille={16} />
            <span>Vue d’ensemble</span>
          </a>
        </Panneau>
      </div>
    );
  }

  const statut = STATUTS[projet.statut];
  const ios = stores && stores !== 'erreur' ? stores.ios : null;
  const android = stores && stores !== 'erreur' ? stores.android : null;
  const sante = disponibilite && disponibilite !== 'erreur' ? disponibilite.resultats[projet.slug] : null;
  let sansVerification = 'Aucune adresse à vérifier';
  if (disponibilite === null) sansVerification = 'Vérification en cours…';
  if (disponibilite === 'erreur') sansVerification = 'Vérification impossible';
  const lignesCout = coutsDuProjet(couts, projet.slug);
  const mensuel = lignesCout.filter((l) => l.projet === projet.slug).reduce((s, l) => s + (l.mensuelEuros || 0), 0);
  const identifiants = lignesIdentifiants(projet.identifiants);
  const mobile = projet.type === 'mobile';
  const avecPocketbase = Boolean(projet.identifiants?.pocketbase);
  const modulePbAbsent = pb && !donneesPb;
  // Site sans PocketBase dont la mesure de fréquentation vit dans le PocketBase d'un autre projet (Runes → portfolio).
  const mesureHebergee = Boolean(projet.identifiants?.mesure?.hebergee);
  // Site suivi par les journaux de son hébergeur (lunello.family) : un panneau « Site », même sur la fiche d'une app.
  const siteSuivi = Boolean(projet.identifiants?.journaux && projet.identifiants.site);
  const domaine = domaines && domaines !== 'erreur' ? domaines.projets[projet.slug] : null;
  const sitesLus = sites && sites !== 'erreur' ? sites : null;
  const donneesSite = sitesLus?.branche ? sitesLus.projets[projet.slug] || null : null;

  return (
    <div className={`tdb-ecran tdb-fiche tdb-fiche--onglet-${onglet}`}>
      <a className="tdb-fiche__retour" href={CHEMINS.vue} onClick={onRetour}>
        <Icone nom="retour" taille={16} />
        Vue d’ensemble
      </a>

      <header className="tdb-fiche__heros" style={{ viewTransitionName: 'tdb-projet' }}>
        <LogoProjet projet={projet} taille={72} nommer />
        <div className="tdb-fiche__identite">
          <h1 className="tdb-fiche__nom">{projet.nom}</h1>
          {projet.description && <p className="tdb-fiche__description">{projet.description}</p>}
          <p className="tdb-fiche__badges">
            <Badge>{TYPES[projet.type]}</Badge>
            <Badge ton={TON_STATUT[projet.statut]}>{statut.libelle}</Badge>
            {mensuel > 0 && <Badge ton="accent">{formaterEuros(mensuel, { centimes: true })} par mois</Badge>}
          </p>
        </div>
        <div className="tdb-fiche__sante">
          {sante ? (
            <>
              {sante.cibles.map((c) => (
                <div key={c.url} className="tdb-fiche__sante-cible">
                  <p className="tdb-fiche__sante-etat">
                    <Pastille etat={PASTILLE_SANTE[c.etat]} />
                    {decrireCible(c)}
                  </p>
                  <p className="tdb-fiche__sante-detail">{hote(c.url)}</p>
                </div>
              ))}
              <p className="tdb-fiche__sante-detail">Vérifié à {formaterHeure(disponibilite.verifieLe)}</p>
            </>
          ) : (
            <p className="tdb-fiche__sante-etat">
              <Pastille etat="inconnu" />
              {sansVerification}
            </p>
          )}
        </div>
      </header>

      <Onglets libelle="Sections de la fiche" className="tdb-fiche__onglets" elements={avecPocketbase ? ONGLETS_AVEC_MEMBRES : ONGLETS} actif={onglet} onChoisir={setOnglet} />

      <Panneau titre="Liens" compteur={projet.liens.length} className="tdb-fiche__liens" i={0}>
        {projet.liens.length ? (
          <div className="tdb-fiche__grille-liens">
            {projet.liens.map((l) => (
              <LienConsole key={l.url + l.libelle} lien={l} icone={ICONES_LIENS[l.categorie] || 'lien-externe'} />
            ))}
          </div>
        ) : (
          <p className="tdb-vide">Aucun lien enregistré.</p>
        )}
      </Panneau>

      <div className="tdb-fiche__corps">
        <div className="tdb-fiche__colonne tdb-fiche__colonne--apercu">
          {mobile ? (
            <>
              <Panneau titre="iOS · App Store" i={1}>
                {ios?.branche && !ios.erreur && ios.projets[projet.slug] && <AppStoreIos app={ios.projets[projet.slug]} periode={ios.periode} />}
                {ios?.branche && !ios.erreur && !ios.projets[projet.slug] && <p className="tdb-vide">Application introuvable dans App Store Connect.</p>}
                {ios?.erreur && <p className="tdb-vide tdb-vide--erreur">{ios.erreur}</p>}
                {stores === null && <p className="tdb-vide">Lecture de l’App Store…</p>}
                {stores === 'erreur' && <p className="tdb-vide tdb-vide--erreur">App Store momentanément illisible.</p>}
                {ios?.branche === false && <SourceNonBranchee>Téléchargements, notes, avis et revenus iOS s’afficheront quand la clé App Store Connect sera installée sur le serveur.</SourceNonBranchee>}
              </Panneau>
              <Panneau titre="Android · Google Play" i={2}>
                {android?.branche && !android.erreur && android.projets[projet.slug] && <GooglePlayAndroid app={android.projets[projet.slug]} />}
                {android?.branche && !android.erreur && !android.projets[projet.slug] && <p className="tdb-vide">Pas de package Android dans l’inventaire.</p>}
                {android?.erreur && <p className="tdb-vide tdb-vide--erreur">{android.erreur}</p>}
                {stores === null && <p className="tdb-vide">Lecture de Google Play…</p>}
                {stores === 'erreur' && <p className="tdb-vide tdb-vide--erreur">Google Play momentanément illisible.</p>}
                {android?.branche === false && <SourceNonBranchee>Installations, notes et taux de plantage Android s’afficheront quand le compte de service Google Play sera installé sur le serveur.</SourceNonBranchee>}
              </Panneau>
            </>
          ) : (
            <Panneau titre="Trafic" i={1}>
              {/* Mesure maison détaillée (collection visites, dans le PocketBase du projet ou dans celui qui l'héberge) :
                  fréquentation complète ; sinon le trafic résumé du module. */}
              {(mesureHebergee || (moduleLu && donneesPb.trafic?.detaille)) && <Frequentation slug={projet.slug} appeler={appeler} onSessionExpiree={onSessionExpiree} rendezVous={projet.identifiants?.mesure?.rendezVous} />}
              {moduleLu && donneesPb.trafic && !donneesPb.trafic.detaille && <TraficSite trafic={donneesPb.trafic} verifieLe={pb.verifieLe} />}
              {moduleLu && !donneesPb.trafic && <p className="tdb-vide">Ce PocketBase ne mesure pas le trafic du site.</p>}
              {donneesPb?.erreur && <p className="tdb-vide tdb-vide--erreur">{donneesPb.erreur}</p>}
              {avecPocketbase && pocketbase === null && <p className="tdb-vide">Lecture du PocketBase…</p>}
              {avecPocketbase && pocketbase === 'erreur' && <p className="tdb-vide tdb-vide--erreur">PocketBase momentanément illisible.</p>}
              {((!avecPocketbase && !mesureHebergee) || modulePbAbsent) && (
                <SourceNonBranchee>
                  {avecPocketbase
                    ? 'Visites, pages vues et sources de trafic s’afficheront quand le module « tableau de bord » sera installé sur le PocketBase du projet.'
                    : 'Visites, pages vues et sources de trafic s’afficheront quand la mesure d’audience du site sera reliée.'}
                </SourceNonBranchee>
              )}
            </Panneau>
          )}
          {siteSuivi && (
            <Panneau titre={`Site · ${hote(projet.identifiants.site)}`} className="tdb-fiche__site" i={2}>
              {donneesSite && !donneesSite.erreur && <SiteJournaux site={donneesSite} verifieLe={sitesLus.verifieLe} />}
              {donneesSite?.erreur && <p className="tdb-vide tdb-vide--erreur">Fréquentation illisible : {donneesSite.erreur}.</p>}
              {sites === null && <p className="tdb-vide">Lecture des journaux du site…</p>}
              {sites === 'erreur' && <p className="tdb-vide tdb-vide--erreur">Journaux du site momentanément illisibles.</p>}
              {sitesLus && !donneesSite && <SourceNonBranchee>Visiteurs, pages vues et clics vers les stores s’afficheront quand l’accès aux journaux de l’hébergeur du site sera installé sur le serveur.</SourceNonBranchee>}
            </Panneau>
          )}
          {moduleLu && donneesPb.usage && (
            <Panneau titre={donneesPb.usage.titre || 'Utilisation'} className="tdb-fiche__usage" i={2}>
              <UsageProjet usage={donneesPb.usage} verifieLe={pb.verifieLe} />
            </Panneau>
          )}
          {avecPocketbase && (
            <Panneau titre={(moduleLu && donneesPb.membres?.libelle) || 'Membres'} compteur={moduleLu ? donneesPb.membres?.total : undefined} className="tdb-fiche__membres" i={2}>
              {moduleLu && donneesPb.membres && <TotauxMembres membres={donneesPb.membres} />}
              {moduleLu && membres === null && <p className="tdb-vide">Lecture des membres…</p>}
              {moduleLu && (membres === 'erreur' || membres?.erreur) && <p className="tdb-vide tdb-vide--erreur">{membres?.erreur || 'Liste des membres momentanément illisible.'}</p>}
              {moduleLu && membres?.liste && <ListeMembres liste={membres.liste} libelles={membres.libelles} note={membres.note} />}
              {donneesPb?.erreur && <p className="tdb-vide tdb-vide--erreur">{donneesPb.erreur}</p>}
              {pocketbase === null && <p className="tdb-vide">Lecture du PocketBase…</p>}
              {pocketbase === 'erreur' && <p className="tdb-vide tdb-vide--erreur">PocketBase momentanément illisible.</p>}
              {modulePbAbsent && (
                <SourceNonBranchee>E-mail, téléphone, date d’inscription et dernière connexion de chaque membre s’afficheront quand le module « tableau de bord » sera installé sur le PocketBase du projet.</SourceNonBranchee>
              )}
            </Panneau>
          )}
          {identifiants.length > 0 && (
            <Panneau titre="Identifiants" i={3}>
              <dl className="tdb-identifiants">
                {identifiants.map(([cle, valeur]) => (
                  <div key={cle} className="tdb-identifiants__ligne">
                    <dt>{cle}</dt>
                    <dd>{valeur}</dd>
                  </div>
                ))}
              </dl>
            </Panneau>
          )}
          <Panneau titre="Code" i={4}>
            {activite?.branche && (activite.projets[projet.slug]?.length ? activite.projets[projet.slug].map((d) => <Depot key={d.nom} depot={d} />) : <p className="tdb-vide">Aucun dépôt GitHub dans l’inventaire pour ce projet.</p>)}
            {activite === null && <p className="tdb-vide">Lecture de GitHub…</p>}
            {activite === 'erreur' && <p className="tdb-vide tdb-vide--erreur">GitHub momentanément illisible.</p>}
            {activite?.branche === false && <SourceNonBranchee compact>Les commits s’afficheront ici quand la clé GitHub en lecture seule sera installée sur le serveur.</SourceNonBranchee>}
          </Panneau>
          {projet.identifiants?.eas && (
            <Panneau titre="Builds et mises à jour" i={5}>
              {builds?.branche && builds.projets[projet.slug] && <BuildsExpo app={builds.projets[projet.slug]} />}
              {builds === null && <p className="tdb-vide">Lecture d’Expo…</p>}
              {builds === 'erreur' && <p className="tdb-vide tdb-vide--erreur">Expo momentanément illisible.</p>}
              {builds?.branche === false && <SourceNonBranchee compact>Builds EAS et mises à jour OTA s’afficheront quand la clé Expo sera installée sur le serveur.</SourceNonBranchee>}
            </Panneau>
          )}
        </div>

        <div className="tdb-fiche__colonne tdb-fiche__colonne--exploitation">
          <Panneau titre="Commandes" compteur={projet.commandes.length} className="tdb-fiche__commandes" i={2}>
            {projet.commandes.length ? (
              projet.commandes.map((c) => (
                <BlocCommande key={c.commande + c.libelle} libelle={`${CATEGORIES_COMMANDES[c.categorie] || c.categorie} · ${c.libelle}`} commande={c.commande} description={c.description} />
              ))
            ) : (
              <p className="tdb-vide">Aucune commande enregistrée.</p>
            )}
          </Panneau>
          {domaine && (
            <Panneau titre="Santé du site" className="tdb-fiche__sante-site" i={3}>
              <SanteSite sante={sante} domaine={domaine} verifieLe={domaines.verifieLe} />
            </Panneau>
          )}
          <DocumentsProjet projet={projet} coffre={coffre} projets={projets} appeler={appeler} onChangement={onCoffreChange} onSessionExpiree={onSessionExpiree} naviguer={naviguer} />
          <Panneau titre="Coûts" className="tdb-fiche__couts" i={3}>
            {lignesCout.length ? (
              <ul className="tdb-liste">
                {lignesCout.map((l) => (
                  <LigneActivite
                    key={l.id}
                    icone="euro"
                    texte={nomCourt(l.libelle)}
                    detail={[l.partageAvec ? (l.partInconnue ? 'partagé entre plusieurs projets, part de celui-ci non mesurable' : 'partagé') : null, l.payeur === 'tiers' ? 'payé par un tiers, non compté' : null, l.aConfirmer ? 'à confirmer' : null, !l.actif ? 'clos' : null].filter(Boolean).join(' · ') || null}
                    temps={l.montantEuros == null ? 'variable' : `${formaterEuros(l.montantEuros, { centimes: true })} ${PERIODICITES[l.periodicite] || ''}`}
                  />
                ))}
              </ul>
            ) : (
              <p className="tdb-vide">Aucun coût propre à ce projet. Les postes communs (Koyeb, Expo, Apple…) sont dans la vue d’ensemble.</p>
            )}
          </Panneau>
          {(projet.notes?.length > 0 || projet.stack) && (
            <Panneau titre="Notes" className="tdb-fiche__notes" i={4}>
              {projet.stack && <p className="tdb-fiche__stack">{projet.stack}</p>}
              <ul className="tdb-fiche__liste-notes">
                {projet.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </Panneau>
          )}
        </div>
      </div>
    </div>
  );
};

export default FicheProjet;
