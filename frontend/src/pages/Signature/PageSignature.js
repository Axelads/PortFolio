import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import InterrupteurGlissant from '../TableauDeBord/composants/InterrupteurGlissant';
import PaveSignature from './PaveSignature';
import { appelerSignature, chargerPdf, enregistrerPdf } from './api';
import '../../styles/pages/signature/_index.scss';

// Page du signataire : lien personnel reçu par e-mail, sans compte. Trois étapes : lecture et consentement,
// code reçu par e-mail, signature. Toutes les preuves sont établies par l'API (api.axelgregoire.fr).

const POLICE_MANUSCRITE = 'https://fonts.googleapis.com/css2?family=Parisienne&display=swap';
const DELAI_RENVOI_S = 45;

const formaterDate = (valeur) =>
  valeur ? new Date(String(valeur).replace(' ', 'T')).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
const nomFichier = (titre) => `${(titre || 'document').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 80)}.pdf`;

const Entete = () => (
  <header className="sig__entete">
    <img className="sig__logo" src="/images/logo-olivier.png" alt="" width="44" height="44" />
    <div>
      <p className="sig__marque">Axel Grégoire</p>
      <p className="sig__sous-marque">Signature électronique · axelgregoire.fr</p>
    </div>
  </header>
);

const Pied = () => (
  <footer className="sig__pied">
    <p>
      Signature électronique au sens du règlement (UE) n° 910/2014 (eIDAS) et des articles 1366 et 1367 du Code civil : identification par votre adresse e-mail et un code à usage unique, consentement exprès, horodatage et
      journal des événements, empreinte du document. Page personnelle, non indexée.
    </p>
    <p>
      Une question ? <a href="mailto:professionnel.agregoire@gmail.com">professionnel.agregoire@gmail.com</a>
    </p>
  </footer>
);

const Message = ({ titre, enfants }) => (
  <div className="sig">
    <Entete />
    <main className="sig__contenu">
      <section className="sig-carte sig-carte--message">
        <h1 className="sig-titre">{titre}</h1>
        {enfants}
      </section>
    </main>
    <Pied />
  </div>
);

const Etapes = ({ courante }) => (
  <ol className="sig-etapes" aria-label="Étapes">
    {['Lecture', 'Vérification', 'Signature'].map((libelle, i) => {
      const n = i + 1;
      const etat = n < courante ? 'faite' : n === courante ? 'courante' : 'a-venir';
      return (
        <li key={libelle} className={`sig-etapes__etape sig-etapes__etape--${etat}`} aria-current={n === courante ? 'step' : undefined}>
          <span className="sig-etapes__numero" aria-hidden="true">
            {n < courante ? '✓' : n}
          </span>
          <span>{libelle}</span>
        </li>
      );
    })}
  </ol>
);

const Signataires = ({ moi, autres }) => (
  <aside className="sig-carte sig-carte--signataires" aria-label="Signataires">
    <p className="sig-etiquette">Signataires</p>
    <ul className="sig-signataires">
      {[{ ...moi, moi: true }, ...autres].map((s, i) => (
        <li key={i} className={`sig-signataires__ligne${s.statut === 'signe' ? ' sig-signataires__ligne--signe' : ''}`}>
          <span className="sig-signataires__pastille" aria-hidden="true" />
          <span className="sig-signataires__textes">
            <span className="sig-signataires__nom">
              {s.prenom} {s.nom}
              {s.moi ? ' (vous)' : ''}
            </span>
            <span className="sig-signataires__detail">{s.role ? `${s.role} · ` : ''}{s.statut === 'signe' ? `signé le ${formaterDate(s.signeLe)}` : 'en attente de signature'}</span>
          </span>
        </li>
      ))}
    </ul>
  </aside>
);

export default function PageSignature() {
  const { jeton } = useParams();
  const [etat, setEtat] = useState('chargement'); // chargement | invalide | pret | fini
  const [infos, setInfos] = useState(null);
  const [urlPdf, setUrlPdf] = useState(null);
  const [etape, setEtape] = useState(1);
  const [lu, setLu] = useState(false);
  const [accord, setAccord] = useState(false);
  const [codeEnvoye, setCodeEnvoye] = useState(null); // { email, valideMinutes }
  const [code, setCode] = useState('');
  const [secondesAvantRenvoi, setSecondesAvantRenvoi] = useState(0);
  const [signature, setSignature] = useState({ mode: 'dessin', image: null });
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState('');
  const [resultat, setResultat] = useState(null);
  const [urlSigne, setUrlSigne] = useState(null);
  const champCode = useRef(null);

  const jetonValide = /^[A-Za-z0-9_-]{43}$/.test(jeton || '');

  useEffect(() => {
    if (!jetonValide) {
      setEtat('invalide');
      return undefined;
    }
    let actif = true;
    (async () => {
      try {
        const { statut, json } = await appelerSignature(`/signer/${jeton}`);
        if (!actif) return;
        if (statut !== 200) {
          setEtat('invalide');
          return;
        }
        setInfos(json);
        setEtat('pret');
        const url = await chargerPdf(`/signer/${jeton}/document`);
        if (actif) setUrlPdf(url);
        if (json.finalise) {
          const signe = await chargerPdf(`/signer/${jeton}/signe`);
          if (actif) setUrlSigne(signe);
        }
      } catch {
        if (actif) setEtat('invalide');
      }
    })();
    return () => {
      actif = false;
    };
  }, [jeton, jetonValide]);

  useEffect(() => {
    if (secondesAvantRenvoi <= 0) return undefined;
    const minuteur = setTimeout(() => setSecondesAvantRenvoi((s) => s - 1), 1000);
    return () => clearTimeout(minuteur);
  }, [secondesAvantRenvoi]);

  const demanderCode = async () => {
    setErreur('');
    setOccupe(true);
    try {
      const { statut, json } = await appelerSignature(`/signer/${jeton}/code`, { methode: 'POST', corps: {} });
      if (statut === 200) {
        setCodeEnvoye(json);
        setCode('');
        setSecondesAvantRenvoi(DELAI_RENVOI_S);
        setTimeout(() => champCode.current?.focus(), 50);
      } else setErreur(json.erreur || 'Envoi du code impossible pour le moment.');
    } catch {
      setErreur('Service injoignable. Réessayez dans un instant.');
    } finally {
      setOccupe(false);
    }
  };

  const signer = async () => {
    setErreur('');
    if (!signature.image) {
      setErreur('Tracez votre signature ou saisissez votre nom avant de signer.');
      return;
    }
    setOccupe(true);
    try {
      const { statut, json } = await appelerSignature(`/signer/${jeton}/signer`, { methode: 'POST', corps: { code, consentements: { lu, accord }, signature } });
      if (statut === 200) {
        setResultat(json);
        setEtat('fini');
        if (json.finalise) setUrlSigne(await chargerPdf(`/signer/${jeton}/signe`));
        return;
      }
      setErreur(json.erreur || 'Signature refusée.');
      if (statut === 401) {
        setEtape(2);
        setCode('');
        if (/expiré|Trop d’essais|Trop d'essais/.test(json.erreur || '')) setCodeEnvoye(null);
      }
    } catch {
      setErreur('Service injoignable. Réessayez dans un instant.');
    } finally {
      setOccupe(false);
    }
  };

  const changerSignature = useCallback((valeur) => setSignature(valeur), []);

  if (etat === 'chargement') return <Message titre="Un instant…" enfants={<p className="sig-texte">Chargement du document.</p>} />;
  if (etat === 'invalide') {
    return (
      <Message
        titre="Ce lien de signature n’est plus valable"
        enfants={
          <>
            <p className="sig-texte">Il a peut-être été remplacé par un nouveau lien, ou le dossier a été clos. Vérifiez le dernier e-mail reçu, ou écrivez à Axel Grégoire pour en recevoir un nouveau.</p>
            <p className="sig-texte">
              <a className="sig-bouton sig-bouton--secondaire" href="mailto:professionnel.agregoire@gmail.com?subject=Lien%20de%20signature">
                Écrire à Axel Grégoire
              </a>
            </p>
          </>
        }
      />
    );
  }

  const { dossier, signataire, autres } = infos;
  const dejaSigne = signataire.statut === 'signe' || etat === 'fini';
  const finalise = Boolean(infos.finalise || resultat?.finalise);
  const restants = etat === 'fini' ? resultat.restants : autres.filter((a) => a.statut !== 'signe').map((a) => `${a.prenom} ${a.nom}`);

  return (
    <div className="sig">
      <Helmet>
        <title>{`Signer : ${dossier.titre} · axelgregoire.fr`}</title>
        <meta name="robots" content="noindex, nofollow, noarchive" />
        <meta name="referrer" content="no-referrer" />
        <link rel="stylesheet" href={POLICE_MANUSCRITE} />
      </Helmet>
      <Entete />
      <main className="sig__contenu">
        <section className="sig-carte sig-carte--document">
          <p className="sig-etiquette">Document à signer</p>
          <h1 className="sig-titre">{dossier.titre}</h1>
          <p className="sig-texte sig-texte--meta">
            {dossier.reference ? `Référence ${dossier.reference} · ` : ''}
            {dossier.pages ? `${dossier.pages} page${dossier.pages > 1 ? 's' : ''} · ` : ''}
            pour {signataire.prenom} {signataire.nom}
            {signataire.role ? `, ${signataire.role}` : ''}
          </p>
          {dossier.note && <p className="sig-note">{dossier.note}</p>}
          <div className="sig-visionneuse">
            {urlPdf ? <iframe className="sig-visionneuse__cadre" src={`${urlPdf}#toolbar=1&view=FitH`} title={`Document : ${dossier.titre}`} /> : <p className="sig-visionneuse__attente">Chargement du document…</p>}
          </div>
          <div className="sig-actions">
            <button type="button" className="sig-bouton sig-bouton--secondaire" onClick={() => urlPdf && window.open(urlPdf, '_blank', 'noopener')} disabled={!urlPdf}>
              Ouvrir dans un nouvel onglet
            </button>
            <button type="button" className="sig-bouton sig-bouton--secondaire" onClick={() => urlPdf && enregistrerPdf(urlPdf, nomFichier(dossier.titre))} disabled={!urlPdf}>
              Télécharger le PDF
            </button>
          </div>
          <p className="sig-empreinte">Empreinte SHA-256 du document : {dossier.empreinte}</p>
        </section>

        <section className="sig-carte sig-carte--etapes" aria-live="polite">
          {dejaSigne ? (
            <>
              <p className="sig-etiquette">{etat === 'fini' ? 'C’est signé' : 'Déjà signé'}</p>
              <h2 className="sig-titre sig-titre--petit">
                {etat === 'fini' ? 'Merci, votre signature est enregistrée.' : `Vous avez signé ce document le ${formaterDate(signataire.signeLe)}.`}
              </h2>
              {finalise ? (
                <>
                  <p className="sig-texte">Toutes les parties ont signé. Le document signé, avec sa page de signatures et son certificat de preuve, vous a été envoyé par e-mail. Vous pouvez aussi l’enregistrer ici.</p>
                  <div className="sig-actions">
                    <button type="button" className="sig-bouton" onClick={() => urlSigne && enregistrerPdf(urlSigne, nomFichier(`${dossier.titre}-signe`))} disabled={!urlSigne}>
                      Télécharger le document signé
                    </button>
                  </div>
                </>
              ) : (
                <p className="sig-texte">
                  {restants.length ? `En attente de : ${restants.join(', ')}. ` : ''}
                  Dès que toutes les parties auront signé, vous recevrez le document signé par e-mail, avec son certificat de preuve.
                </p>
              )}
            </>
          ) : dossier.statut !== 'en_attente' ? (
            <>
              <p className="sig-etiquette">Dossier clos</p>
              <p className="sig-texte">Ce document n’est plus ouvert à la signature.</p>
            </>
          ) : (
            <>
              <Etapes courante={etape} />

              {etape === 1 && (
                <div className="sig-etape">
                  <h2 className="sig-titre sig-titre--petit">Lisez le document, puis confirmez</h2>
                  <div className="sig-consentement">
                    <div className="sig-consentement__interrupteur">
                      <InterrupteurGlissant actif={lu} onChangement={setLu} libelle="J’ai lu l’intégralité du document" />
                    </div>
                    <span className="sig-consentement__texte" onClick={() => setLu((v) => !v)} aria-hidden="true">
                      <strong>J’ai lu l’intégralité du document</strong>
                      <span>y compris ses annexes, et j’en comprends les termes.</span>
                    </span>
                  </div>
                  <div className="sig-consentement">
                    <div className="sig-consentement__interrupteur">
                      <InterrupteurGlissant actif={accord} onChangement={setAccord} libelle="J’accepte de signer ce document par voie électronique" />
                    </div>
                    <span className="sig-consentement__texte" onClick={() => setAccord((v) => !v)} aria-hidden="true">
                      <strong>J’accepte de signer ce document par voie électronique</strong>
                      <span>et je reconnais que cette signature a la même valeur qu’une signature manuscrite (articles 1366 et 1367 du Code civil).</span>
                    </span>
                  </div>
                  <div className="sig-actions">
                    <button type="button" className="sig-bouton" disabled={!lu || !accord} onClick={() => setEtape(2)}>
                      Continuer
                    </button>
                  </div>
                </div>
              )}

              {etape === 2 && (
                <div className="sig-etape">
                  <h2 className="sig-titre sig-titre--petit">Confirmez votre identité</h2>
                  {!codeEnvoye ? (
                    <>
                      <p className="sig-texte">Un code à 6 chiffres va être envoyé à votre adresse {signataire.email}. Il prouve que c’est bien vous qui signez.</p>
                      <div className="sig-actions">
                        <button type="button" className="sig-bouton" onClick={demanderCode} disabled={occupe}>
                          {occupe ? 'Envoi…' : 'Recevoir mon code par e-mail'}
                        </button>
                        <button type="button" className="sig-bouton sig-bouton--fantome" onClick={() => setEtape(1)} disabled={occupe}>
                          Retour
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="sig-texte">
                        Code envoyé à {codeEnvoye.email}. Il est valable {codeEnvoye.valideMinutes} minutes. Pensez à vérifier vos courriers indésirables.
                      </p>
                      <label className="sig-champ sig-champ--code">
                        <span className="sig-champ__libelle">Code reçu par e-mail</span>
                        <input
                          ref={champCode}
                          className="sig-champ__saisie sig-champ__saisie--code"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          aria-invalid={Boolean(erreur)}
                        />
                      </label>
                      <div className="sig-actions">
                        <button type="button" className="sig-bouton" disabled={code.length !== 6} onClick={() => { setErreur(''); setEtape(3); }}>
                          Continuer
                        </button>
                        <button type="button" className="sig-bouton sig-bouton--fantome" onClick={demanderCode} disabled={occupe || secondesAvantRenvoi > 0}>
                          {secondesAvantRenvoi > 0 ? `Renvoyer le code (${secondesAvantRenvoi} s)` : 'Renvoyer le code'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {etape === 3 && (
                <div className="sig-etape">
                  <h2 className="sig-titre sig-titre--petit">Votre signature</h2>
                  <PaveSignature nomParDefaut={`${signataire.prenom} ${signataire.nom}`} onChange={changerSignature} desactive={occupe} />
                  <p className="sig-texte sig-texte--petit">
                    En cliquant sur « Signer le document », vous apposez votre signature sur « {dossier.titre} ». La date, l’heure et l’adresse de connexion seront enregistrées dans le certificat de preuve.
                  </p>
                  <div className="sig-actions">
                    <button type="button" className="sig-bouton" onClick={signer} disabled={occupe || !signature.image}>
                      {occupe ? 'Signature en cours…' : 'Signer le document'}
                    </button>
                    <button type="button" className="sig-bouton sig-bouton--fantome" onClick={() => setEtape(2)} disabled={occupe}>
                      Retour
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          <p className="sig-erreur" role="alert">
            {erreur}
          </p>
        </section>

        <Signataires moi={etat === 'fini' ? { ...signataire, statut: 'signe', signeLe: resultat.signeLe } : signataire} autres={autres} />
      </main>
      <Pied />
    </div>
  );
}
