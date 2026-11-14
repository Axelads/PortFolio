import React, { useCallback, useEffect, useState } from 'react';
import Indicateur from '../composants/Indicateur';
import { Bouton, Onglets, Panneau, Pastille, TitreRevele } from '../composants/elements';
import { decrireAppareil, EVENEMENTS, FILTRES_JOURNAL, formaterDateHeure, formaterDateLongue, formaterHeure, tronquerIp } from '../outils';

const PASTILLE_RESULTAT = { reussi: 'en-ligne', refuse: 'panne', verrouillage: 'alerte' };

// Ce qui protège réellement la page aujourd'hui (Phase 1), et ce qui reste à faire.
const PROTECTIONS = [
  ['en-ligne', 'Second facteur par e-mail', 'Code à 8 chiffres sur tout nouvel appareil, valable 5 minutes'],
  ['en-ligne', 'Appareils de confiance', 'Connexion gardée 30 jours sur un appareil mémorisé, révocable ici'],
  ['en-ligne', 'Cookie chiffré', 'httpOnly, Secure, SameSite=Strict, préfixe __Host-'],
  ['en-ligne', 'Verrouillage progressif', '5 échecs → 15 min ; 15 échecs en 24 h → 24 h'],
  ['en-ligne', 'En-têtes stricts', 'CSP par empreintes, noindex, aucune intégration en iframe'],
  ['alerte', 'Purge du journal à 90 jours', 'Tâche planifiée à créer'],
  ['inconnu', 'Alertes Telegram', 'Prévues plus tard'],
];

/** Une entrée du journal (composant Figma « Ligne de journal »). */
const LigneJournal = ({ entree }) => {
  const ev = EVENEMENTS[entree.evenement] || { libelle: entree.evenement, resultat: entree.reussi ? 'reussi' : 'refuse', detail: '' };
  return (
    <li className="tdb-journal__ligne">
      <Pastille etat={PASTILLE_RESULTAT[ev.resultat]} />
      <span className="tdb-journal__textes">
        <span className="tdb-journal__evenement">{ev.libelle}</span>
        {/* « déconnexion partout » range un horodatage technique dans `detail` : on garde le texte par défaut */}
        <span className="tdb-journal__detail">{entree.detail && !/^\d+$/.test(entree.detail) ? entree.detail : ev.detail}</span>
      </span>
      <span className="tdb-journal__ip" title={entree.ip || undefined}>
        {tronquerIp(entree.ip)}
      </span>
      <span className="tdb-journal__appareil">{decrireAppareil(entree.user_agent)}</span>
      <time className="tdb-journal__date" dateTime={String(entree.date).replace(' ', 'T')}>
        {formaterDateHeure(entree.date)}
      </time>
    </li>
  );
};

/** Un appareil de confiance (panneau « Appareils de confiance »). */
const LigneAppareil = ({ appareil, occupe, onRevoquer }) => (
  <li className="tdb-appareils__ligne">
    <Pastille etat={appareil.courant ? 'en-ligne' : 'inconnu'} />
    <span className="tdb-ligne__textes">
      <span className="tdb-ligne__titre">
        {decrireAppareil(appareil.agent)}
        {appareil.courant && <span className="tdb-appareils__courant">cet appareil</span>}
      </span>
      <span className="tdb-ligne__detail">
        Mémorisé le {formaterDateHeure(appareil.memoriseLe)} · dernière connexion le {formaterDateHeure(appareil.derniereUtilisation)} · expire le {formaterDateHeure(appareil.expireLe)}
      </span>
    </span>
    <Bouton variante="fantome" onClick={() => onRevoquer(appareil.id)} disabled={occupe} className="tdb-appareils__revoquer">
      Révoquer
    </Bouton>
  </li>
);

/** Page Sécurité (maquette « Sécurité / bureau » et « / mobile »). */
const Securite = ({ appeler, session: sessionOuverte, occupe, onSessionExpiree, onDeconnexionPartout }) => {
  // La session change quand on révoque son propre appareil (elle redevient ordinaire) : elle est alors relue.
  const [session, setSession] = useState(sessionOuverte);
  const [resume, setResume] = useState(null);
  const [journal, setJournal] = useState(null);
  const [appareils, setAppareils] = useState(null);
  const [erreur, setErreur] = useState('');
  const [erreurAppareils, setErreurAppareils] = useState('');
  const [filtre, setFiltre] = useState('tout');

  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        const [r, j, a] = await Promise.all([appeler('/securite/resume'), appeler('/securite/journal'), appeler('/appareils')]);
        if (!actif) return;
        if (r.statut === 401 || j.statut === 401 || a.statut === 401) {
          onSessionExpiree();
          return;
        }
        setResume(r.statut === 200 ? r.json : null);
        setJournal(j.statut === 200 ? j.json.entrees || [] : []);
        setAppareils(a.statut === 200 ? a.json.appareils || [] : []);
        if (r.statut !== 200 || j.statut !== 200) setErreur('Journal momentanément indisponible.');
        if (a.statut !== 200) setErreurAppareils('Liste momentanément indisponible.');
      } catch {
        if (actif) setErreur('Service injoignable. Réessaie dans un instant.');
      }
    })();
    return () => {
      actif = false;
    };
  }, [appeler, onSessionExpiree]);

  const revoquer = useCallback(
    async (id) => {
      setErreurAppareils('');
      try {
        const { statut } = await appeler(`/appareils/${id}/revoquer`, { methode: 'POST' });
        if (statut === 401) return onSessionExpiree();
        if (statut === 200 || statut === 404) {
          if (appareils?.find((a) => a.id === id)?.courant) {
            const relue = await appeler('/session');
            if (relue.statut === 200) setSession(relue.json);
          }
          return setAppareils((liste) => (liste || []).filter((a) => a.id !== id));
        }
        return setErreurAppareils('Révocation impossible pour le moment. Réessaie dans un instant.');
      } catch {
        return setErreurAppareils('Service injoignable. Réessaie dans un instant.');
      }
    },
    [appeler, appareils, onSessionExpiree],
  );

  const entrees = (journal || []).filter(FILTRES_JOURNAL.find((f) => f.cle === filtre).garde);
  const derniere = (cle) => (resume?.[cle] ? `Le ${formaterDateHeure(resume[cle].date).replace(' · ', ' à ')}` : null);

  return (
    <div className="tdb-ecran tdb-securite">
      <div className="tdb-titre">
        <TitreRevele texte="Sécurité" className="tdb-titre__texte" />
        {session && (
          <p className="tdb-titre__sous">
            {session.durable
              ? `Session gardée sur cet appareil de confiance jusqu’au ${formaterDateLongue(session.expireLe)}`
              : `Session ouverte à ${formaterHeure(session.ouverteLe)} · expire à ${formaterHeure(session.expireLe)}, ou après ${Math.round(session.inactiviteMaxMs / 60000)} min sans activité`}
          </p>
        )}
      </div>

      <div className="tdb-indicateurs tdb-indicateurs--quatre">
        <Indicateur i={0} icone="bouclier" libelle="Connexions réussies" valeur={resume?.reussies ?? null} unite={`${resume?.jours ?? 30} jours`} contexte={derniere('derniereConnexion') || 'Aucune'} fraicheur="Journal · à l’instant" />
        <Indicateur i={1} icone="alerte" libelle="Tentatives refusées" valeur={resume?.refus ?? null} unite={`${resume?.jours ?? 30} jours`} contexte="Mot de passe ou code erroné" fraicheur="Journal · à l’instant" etatFraicheur={resume?.refus ? 'alerte' : 'en-ligne'} />
        <Indicateur i={2} icone="bouclier" libelle="Verrouillages" valeur={resume?.verrouillages ?? null} unite={`${resume?.jours ?? 30} jours`} contexte={derniere('dernierVerrouillage') || 'Aucun'} fraicheur="Journal · à l’instant" etatFraicheur={resume?.verrouillages ? 'alerte' : 'en-ligne'} />
        <Indicateur i={3} icone="utilisateurs" libelle="Sessions possibles" valeur={resume?.sessionsPossibles ?? null} unite="moins de 8 h" contexte={appareils?.length ? `Connexions récentes, plus ${appareils.length} appareil${appareils.length > 1 ? 's' : ''} de confiance gardé${appareils.length > 1 ? 's' : ''} jusqu’à 30 jours` : 'Connexions encore valides depuis la dernière révocation'} fraicheur="Journal · à l’instant" />
      </div>

      <div className="tdb-securite__corps">
        <Panneau
          titre="Journal de sécurité"
          className="tdb-journal"
          i={1}
          action={<Onglets libelle="Filtrer le journal" elements={FILTRES_JOURNAL} actif={filtre} onChoisir={setFiltre} className="tdb-journal__filtres" />}
        >
          {journal === null && !erreur && <p className="tdb-vide">Chargement du journal…</p>}
          {erreur && <p className="tdb-vide tdb-vide--erreur">{erreur}</p>}
          {journal && (
            <>
              <div className="tdb-journal__entetes" aria-hidden="true">
                <span />
                <span>Événement</span>
                <span className="tdb-journal__ip">Adresse IP</span>
                <span className="tdb-journal__appareil">Appareil</span>
                <span className="tdb-journal__date">Date</span>
              </div>
              {entrees.length ? (
                <ul className="tdb-journal__liste">
                  {entrees.map((e, i) => (
                    <LigneJournal key={`${e.date}-${i}`} entree={e} />
                  ))}
                </ul>
              ) : (
                <p className="tdb-vide">Aucune entrée pour ce filtre.</p>
              )}
              <p className="tdb-journal__pied">50 dernières entrées, conservées 90 jours. Les adresses IP sont tronquées à l’affichage ; l’adresse complète reste dans PocketBase.</p>
            </>
          )}
        </Panneau>

        <div className="tdb-securite__colonne">
          <Panneau titre="Session en cours" className="tdb-session" i={0}>
            <dl className="tdb-identifiants tdb-identifiants--texte">
              {session && (
                <>
                  <div className="tdb-identifiants__ligne">
                    <dt>Ouverte à</dt>
                    <dd>{formaterDateHeure(session.ouverteLe)}</dd>
                  </div>
                  <div className="tdb-identifiants__ligne">
                    <dt>{session.durable ? 'Expire le' : 'Expire à'}</dt>
                    <dd>{session.durable ? `${formaterDateLongue(session.expireLe)}, avec l’appareil de confiance` : `${formaterHeure(session.expireLe)} (8 h au maximum)`}</dd>
                  </div>
                  <div className="tdb-identifiants__ligne">
                    <dt>Sans activité</dt>
                    <dd>{session.durable ? 'reste ouverte sur cet appareil' : `fermée après ${Math.round(session.inactiviteMaxMs / 60000)} min`}</dd>
                  </div>
                </>
              )}
              <div className="tdb-identifiants__ligne">
                <dt>Appareil</dt>
                <dd>{decrireAppareil(navigator.userAgent)}</dd>
              </div>
              <div className="tdb-identifiants__ligne">
                <dt>Second facteur</dt>
                <dd>{session?.secondFacteur === 'appareil' ? 'appareil de confiance, sans code' : 'code e-mail validé'}</dd>
              </div>
            </dl>
            <Bouton variante="secondaire" icone="deconnexion" onClick={onDeconnexionPartout} disabled={occupe} className="tdb-session__bouton">
              Déconnecter toutes les sessions
            </Bouton>
            <p className="tdb-session__explication">Aucune session n’est stockée : ce bouton invalide d’un coup tous les cookies émis avant maintenant, y compris celui-ci, et oublie tous les appareils de confiance.</p>
          </Panneau>

          <Panneau titre="Appareils de confiance" compteur={appareils?.length || undefined} className="tdb-appareils" i={1}>
            {appareils === null && !erreurAppareils && <p className="tdb-vide">Chargement…</p>}
            {erreurAppareils && <p className="tdb-vide tdb-vide--erreur">{erreurAppareils}</p>}
            {appareils && appareils.length === 0 && !erreurAppareils && (
              <p className="tdb-vide">Aucun appareil mémorisé. À la prochaine connexion, active « Se souvenir de cet appareil » : tu y resteras connecté pendant 30 jours.</p>
            )}
            {appareils && appareils.length > 0 && (
              <ul className="tdb-appareils__liste">
                {appareils.map((a) => (
                  <LigneAppareil key={a.id} appareil={a} occupe={occupe} onRevoquer={revoquer} />
                ))}
              </ul>
            )}
            <p className="tdb-session__explication">Sur un appareil mémorisé, la session reste ouverte pendant 30 jours fixes, sans mot de passe ni code à retaper. Révoquer un appareil ferme sa session en 5 minutes au plus, et y rétablit le mot de passe et le code.</p>
          </Panneau>

          <Panneau titre="Protections actives" i={3}>
            <ul className="tdb-protections">
              {PROTECTIONS.map(([etat, titre, detail]) => (
                <li key={titre} className="tdb-protections__ligne">
                  <Pastille etat={etat} />
                  <span className="tdb-ligne__textes">
                    <span className="tdb-ligne__titre">{titre}</span>
                    <span className="tdb-ligne__detail">{detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Panneau>
        </div>
      </div>
    </div>
  );
};

export default Securite;
