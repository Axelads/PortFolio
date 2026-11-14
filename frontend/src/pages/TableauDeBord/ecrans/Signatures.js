import React, { useCallback, useEffect, useState } from 'react';
import { ChampsPeriode, ChoixProjet, FormulaireDocument, LienApercu, nomDeFichier, periodePourEnvoi, telechargerFichier } from '../composants/Documents';
import { Badge, Bouton, Panneau, Pastille, TitreRevele } from '../composants/elements';
import Icone from '../composants/Icone';
import { decrirePeriode, etatPeriode, PERIODE_VIDE } from '../echeances';
import { formaterDateHeure } from '../outils';

// Écran « Signatures » : envoyer un document à signer, suivre les dossiers, télécharger les documents signés.
// Toutes les données viennent de l'API (session du tableau de bord) ; les fichiers sont chiffrés côté API.
// Un dossier rangé dans un projet figure dans la fiche de ce projet et dans l'écran « Documents », « en attente de
// signature » puis « signé ».

const SIGNATAIRE_VIDE = { prenom: '', nom: '', email: '', role: '' };
const MOI = { prenom: 'Axel', nom: 'Grégoire', email: 'professionnel.agregoire@gmail.com', role: 'Prestataire' };
const STATUTS = {
  en_attente: { libelle: 'En attente', ton: 'alerte' },
  signe: { libelle: 'Signé', ton: 'en-ligne' },
  annule: { libelle: 'Annulé', ton: 'neutre' },
};
const LIBELLES_EVENEMENTS = {
  dossier_cree: 'Dossier créé',
  invitation_envoyee: 'Invitation envoyée',
  relance: 'Invitation renvoyée',
  page_ouverte: 'Page ouverte',
  document_consulte: 'Document consulté',
  code_envoye: 'Code envoyé',
  code_refuse: 'Code refusé',
  signature_posee: 'Signature apposée',
  dossier_finalise: 'Document final assemblé',
  courrier_envoye: 'Document signé envoyé',
  dossier_annule: 'Dossier annulé',
};

const lireBase64 = (fichier) =>
  new Promise((resoudre, rejeter) => {
    const lecteur = new FileReader();
    lecteur.onload = () => resoudre(String(lecteur.result).split(',')[1] || '');
    lecteur.onerror = () => rejeter(new Error('lecture impossible'));
    lecteur.readAsDataURL(fichier);
  });

/** Lien personnel à transmettre si l'e-mail n'est pas arrivé : copie dans le presse-papiers. */
const LienSignataire = ({ lien }) => {
  const [copie, setCopie] = useState(false);
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(lien.lien);
      setCopie(true);
      setTimeout(() => setCopie(false), 1500);
    } catch {
      window.prompt('Copier ce lien :', lien.lien);
    }
  };
  return (
    <li className="tdb-signatures__lien">
      <span className="tdb-ligne__textes">
        <span className="tdb-ligne__titre">
          {lien.prenom} {lien.nom} <span className="tdb-signatures__email">{lien.email}</span>
        </span>
        <span className="tdb-ligne__detail">{lien.invitation === 'envoyee' ? 'Invitation envoyée par e-mail' : 'E-mail non parti : transmettez le lien vous-même'}</span>
      </span>
      <Bouton variante="fantome" icone={copie ? 'valide' : 'copier'} onClick={copier}>
        {copie ? 'Copié' : 'Copier le lien'}
      </Bouton>
    </li>
  );
};

const Formulaire = ({ appeler, projets, onCree, onSessionExpiree }) => {
  const [titre, setTitre] = useState('');
  const [projet, setProjet] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  // Période du contrat et dates à suivre : restent côté tableau de bord, les signataires ne les voient pas.
  const [periode, setPeriode] = useState(PERIODE_VIDE);
  // Compteur d'envois : remonte le bloc « période » replié après un envoi réussi.
  const [envois, setEnvois] = useState(0);
  const [fichier, setFichier] = useState(null);
  const [signataires, setSignataires] = useState([{ ...MOI }, { ...SIGNATAIRE_VIDE }, { ...SIGNATAIRE_VIDE }]);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState('');
  const [liens, setLiens] = useState(null);

  const modifier = (i, champ, valeur) => setSignataires((s) => s.map((x, k) => (k === i ? { ...x, [champ]: valeur } : x)));
  const retirer = (i) => setSignataires((s) => s.filter((_, k) => k !== i));
  const ajouter = () => setSignataires((s) => (s.length < 6 ? [...s, { ...SIGNATAIRE_VIDE }] : s));
  const complets = signataires.filter((s) => s.prenom.trim() && s.nom.trim() && s.email.trim());
  const pret = titre.trim().length >= 3 && fichier && complets.length >= 1 && complets.length === signataires.length;

  const envoyer = async (e) => {
    e.preventDefault();
    setErreur('');
    const dates = periodePourEnvoi(periode);
    if (dates.erreur) return setErreur(dates.erreur);
    setOccupe(true);
    try {
      if (fichier.size > 8 * 1024 * 1024) throw new Error('Le PDF dépasse 8 Mo.');
      const pdf = await lireBase64(fichier);
      const { statut, json } = await appeler('/signature/dossiers', { methode: 'POST', corps: { titre: titre.trim(), reference: reference.trim(), note: note.trim(), projet, ...dates.valeur, pdf, signataires: complets.map((s) => ({ prenom: s.prenom.trim(), nom: s.nom.trim(), email: s.email.trim(), role: s.role.trim() })) } });
      if (statut === 401) return onSessionExpiree();
      if (statut !== 200) throw new Error(json.erreur || `Envoi refusé (HTTP ${statut}).`);
      setLiens(json.liens);
      setTitre('');
      setProjet('');
      setReference('');
      setNote('');
      setPeriode(PERIODE_VIDE);
      setEnvois((n) => n + 1);
      setFichier(null);
      setSignataires([{ ...MOI }, { ...SIGNATAIRE_VIDE }, { ...SIGNATAIRE_VIDE }]);
      onCree();
      return undefined;
    } catch (erreurEnvoi) {
      return setErreur(erreurEnvoi.message);
    } finally {
      setOccupe(false);
    }
  };

  return (
    <Panneau titre="Nouveau document à signer" id="tdb-signatures-nouveau" i={0}>
      <form className="tdb-signatures__formulaire" onSubmit={envoyer} noValidate>
        <div className="tdb-signatures__grille">
          <label className="tdb-champ tdb-signatures__large">
            <span className="tdb-champ__libelle">Titre du document</span>
            <input className="tdb-champ__saisie" value={titre} onChange={(e) => setTitre(e.target.value)} maxLength={200} placeholder="Contrat de création du site honneure.fr" required />
          </label>
          <label className="tdb-champ">
            <span className="tdb-champ__libelle">Référence (facultatif)</span>
            <input className="tdb-champ__saisie" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={120} placeholder="F-2026-001" />
          </label>
          <label className="tdb-champ">
            <span className="tdb-champ__libelle">Fichier PDF (8 Mo au plus)</span>
            <input className="tdb-champ__saisie tdb-champ__saisie--fichier" type="file" accept="application/pdf,.pdf" onChange={(e) => setFichier(e.target.files?.[0] || null)} />
          </label>
          <label className="tdb-champ tdb-signatures__large">
            <span className="tdb-champ__libelle">Projet où ranger le contrat (facultatif)</span>
            <ChoixProjet projets={projets} valeur={projet} onChange={setProjet} />
          </label>
          <label className="tdb-champ tdb-signatures__large">
            <span className="tdb-champ__libelle">Note affichée aux signataires (facultatif)</span>
            <textarea className="tdb-champ__saisie tdb-signatures__note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={2} placeholder="Ce contrat formalise la création du site. Lisez les quatre annexes avant de signer." />
          </label>
          <div className="tdb-signatures__large">
            <ChampsPeriode key={envois} periode={periode} onChange={setPeriode} />
          </div>
        </div>

        <p className="tdb-signatures__intertitre">Signataires (chacun reçoit son lien personnel par e-mail)</p>
        <ul className="tdb-signatures__signataires">
          {signataires.map((s, i) => (
            <li key={i} className="tdb-signatures__signataire">
              <input className="tdb-champ__saisie" placeholder="Prénom" value={s.prenom} onChange={(e) => modifier(i, 'prenom', e.target.value)} maxLength={60} aria-label={`Prénom du signataire ${i + 1}`} />
              <input className="tdb-champ__saisie" placeholder="Nom" value={s.nom} onChange={(e) => modifier(i, 'nom', e.target.value)} maxLength={80} aria-label={`Nom du signataire ${i + 1}`} />
              <input className="tdb-champ__saisie" type="email" placeholder="adresse@exemple.fr" value={s.email} onChange={(e) => modifier(i, 'email', e.target.value)} maxLength={254} aria-label={`E-mail du signataire ${i + 1}`} />
              <input className="tdb-champ__saisie" placeholder="Qualité (Président…)" value={s.role} onChange={(e) => modifier(i, 'role', e.target.value)} maxLength={120} aria-label={`Qualité du signataire ${i + 1}`} />
              <button type="button" className="tdb-icone-bouton" onClick={() => retirer(i)} aria-label={`Retirer le signataire ${i + 1}`} disabled={signataires.length <= 1}>
                <Icone nom="retour" taille={16} />
              </button>
            </li>
          ))}
        </ul>
        <div className="tdb-signatures__actions">
          <Bouton variante="secondaire" onClick={ajouter} disabled={signataires.length >= 6}>
            Ajouter un signataire
          </Bouton>
          <Bouton type="submit" icone="fusee" disabled={!pret || occupe}>
            {occupe ? 'Envoi…' : 'Envoyer les invitations'}
          </Bouton>
        </div>
        <p className="tdb-signatures__erreur" role="alert">
          {erreur}
        </p>
        {liens && (
          <div className="tdb-signatures__liens">
            <p className="tdb-signatures__intertitre">Invitations parties. Liens personnels (à n’utiliser que si un e-mail n’arrive pas) :</p>
            <ul>
              {liens.map((l) => (
                <LienSignataire key={l.id} lien={l} />
              ))}
            </ul>
          </div>
        )}
      </form>
    </Panneau>
  );
};

const Dossier = ({ dossier, projets, appeler, onChange, onSessionExpiree }) => {
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState('');
  const [journal, setJournal] = useState(null);
  const [liens, setLiens] = useState(null);
  // Classement du dossier : projet, période du contrat et dates clés (formulaire du coffre, ouvert à la demande).
  const [classement, setClassement] = useState(false);
  const statut = STATUTS[dossier.statut] || { libelle: dossier.statut, ton: 'neutre' };
  const projet = projets.find((p) => p.slug === dossier.projet);
  const periodeEnClair = decrirePeriode(dossier.periode);
  const echeance = etatPeriode(dossier.periode);
  const nombreDates = dossier.periode?.datesCles?.length || 0;

  const action = async (fn) => {
    setErreur('');
    setOccupe(true);
    try {
      await fn();
    } catch (e) {
      if (e.session) onSessionExpiree();
      else setErreur(e.message || 'Action impossible.');
    } finally {
      setOccupe(false);
    }
  };
  const relancer = () =>
    action(async () => {
      const { statut: s, json } = await appeler(`/signature/dossiers/${dossier.id}/relancer`, { methode: 'POST' });
      if (s === 401) return onSessionExpiree();
      if (s !== 200) throw new Error(json.erreur || `HTTP ${s}`);
      setLiens(json.liens);
      return onChange();
    });
  const annuler = () =>
    action(async () => {
      if (!window.confirm(`Annuler le dossier « ${dossier.titre} » ? Les liens envoyés ne fonctionneront plus.`)) return undefined;
      const { statut: s, json } = await appeler(`/signature/dossiers/${dossier.id}/annuler`, { methode: 'POST' });
      if (s === 401) return onSessionExpiree();
      if (s !== 200) throw new Error(json.erreur || `HTTP ${s}`);
      return onChange();
    });
  const voirJournal = () =>
    action(async () => {
      if (journal) return setJournal(null);
      const { statut: s, json } = await appeler(`/signature/dossiers/${dossier.id}/evenements`);
      if (s === 401) return onSessionExpiree();
      if (s !== 200) throw new Error(json.erreur || `HTTP ${s}`);
      return setJournal(json.evenements);
    });

  return (
    <li className="tdb-signatures__dossier">
      <header className="tdb-signatures__tete">
        <div>
          <p className="tdb-signatures__titre">{dossier.titre}</p>
          <p className="tdb-ligne__detail">
            {dossier.reference ? `${dossier.reference} · ` : ''}
            {dossier.pages ? `${dossier.pages} page${dossier.pages > 1 ? 's' : ''} · ` : ''}créé le {formaterDateHeure(dossier.creeLe)}
            {dossier.signeLe ? ` · signé par tous le ${formaterDateHeure(dossier.signeLe)}` : ''}
          </p>
        </div>
        <Badge ton={statut.ton}>{statut.libelle}</Badge>
      </header>
      <ul className="tdb-signatures__etats">
        {dossier.signataires.map((s) => (
          <li key={s.id} className="tdb-ligne">
            <Pastille etat={s.statut === 'signe' ? 'en-ligne' : dossier.statut === 'annule' ? 'inconnu' : 'alerte'} />
            <span className="tdb-ligne__textes">
              <span className="tdb-ligne__titre">
                {s.prenom} {s.nom}
                {s.role ? <span className="tdb-signatures__role"> · {s.role}</span> : null}
              </span>
              <span className="tdb-ligne__detail">
                {s.email} · {s.statut === 'signe' ? `signé le ${formaterDateHeure(s.signeLe)}${s.ip ? ` depuis ${s.ip}` : ''}` : s.invitationLe ? `invité le ${formaterDateHeure(s.invitationLe)}` : 'invitation non envoyée'}
              </span>
            </span>
          </li>
        ))}
      </ul>
      {dossier.statut !== 'annule' && (
        <div className="tdb-signatures__rangement">
          <p className="tdb-signatures__classement">
            <Icone nom="dossier" taille={14} />
            <span>
              <strong>{projet ? projet.nom : dossier.projet || 'Sans projet'}</strong>
              {periodeEnClair && ` · ${periodeEnClair}`}
              {echeance && (
                <>
                  {' · '}
                  <strong className={`tdb-document__echeance tdb-document__echeance--${echeance.ton}`}>{echeance.texte}</strong>
                </>
              )}
              {nombreDates > 0 && ` · ${nombreDates} date${nombreDates > 1 ? 's' : ''} clé${nombreDates > 1 ? 's' : ''}`}
            </span>
          </p>
          <Bouton variante="fantome" icone="crayon" onClick={() => setClassement((v) => !v)} aria-expanded={classement} disabled={occupe}>
            Projet et dates
          </Bouton>
          {classement && (
            <FormulaireDocument
              appeler={appeler}
              projets={projets}
              document={{ id: dossier.id, source: 'signature', projet: dossier.projet || '', periode: dossier.periode }}
              onSessionExpiree={onSessionExpiree}
              onAnnuler={() => setClassement(false)}
              onEnregistre={() => {
                setClassement(false);
                onChange();
              }}
            />
          )}
        </div>
      )}
      <div className="tdb-signatures__actions">
        {/* Un clic ouvre le PDF dans un nouvel onglet ; la flèche l'enregistre. */}
        <LienApercu chemin={`/signature/dossiers/${dossier.id}/document`} variante="fantome">
          Original
        </LienApercu>
        {dossier.statut !== 'signe' && (
          <button type="button" className="tdb-icone-bouton" onClick={() => action(() => telechargerFichier(`/signature/dossiers/${dossier.id}/document`, nomDeFichier(dossier.titre)))} aria-label={`Télécharger l’original de « ${dossier.titre} »`} title="Télécharger l’original" disabled={occupe}>
            <Icone nom="telechargement" taille={16} />
          </button>
        )}
        {dossier.statut === 'signe' && (
          <>
            <LienApercu chemin={`/signature/dossiers/${dossier.id}/signe`}>Document signé</LienApercu>
            <button type="button" className="tdb-icone-bouton" onClick={() => action(() => telechargerFichier(`/signature/dossiers/${dossier.id}/signe`, nomDeFichier(dossier.titre, '-signe')))} aria-label={`Télécharger le document signé « ${dossier.titre} »`} title="Télécharger le document signé" disabled={occupe}>
              <Icone nom="telechargement" taille={16} />
            </button>
          </>
        )}
        {dossier.statut === 'en_attente' && (
          <>
            <Bouton variante="fantome" icone="cloche" onClick={relancer} disabled={occupe}>
              Relancer
            </Bouton>
            <Bouton variante="fantome" icone="alerte" onClick={annuler} disabled={occupe}>
              Annuler
            </Bouton>
          </>
        )}
        <Bouton variante="fantome" icone="activite" onClick={voirJournal} disabled={occupe}>
          {journal ? 'Masquer le journal' : 'Journal de preuve'}
        </Bouton>
      </div>
      {dossier.empreinteSignee && <p className="tdb-signatures__empreinte">SHA-256 du document signé : {dossier.empreinteSignee}</p>}
      {liens && (
        <ul className="tdb-signatures__liens">
          {liens.map((l) => (
            <LienSignataire key={l.id} lien={l} />
          ))}
        </ul>
      )}
      {journal && (
        <ol className="tdb-signatures__journal">
          {journal.map((e, i) => (
            <li key={i}>
              <span className="tdb-signatures__date">{formaterDateHeure(e.date)}</span>
              <span>
                {LIBELLES_EVENEMENTS[e.evenement] || e.evenement}
                {e.signataire ? ` — ${e.signataire}` : ''}
                {e.ip ? ` — ${e.ip}` : ''}
                {e.detail ? ` — ${e.detail}` : ''}
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="tdb-signatures__erreur" role="alert">
        {erreur}
      </p>
    </li>
  );
};

/** Page Signatures : formulaire d'envoi et suivi des dossiers. `onCoffreChange` : le coffre de documents est à relire. */
const Signatures = ({ appeler, projets, onCoffreChange, onSessionExpiree }) => {
  const [dossiers, setDossiers] = useState(null);
  const [erreur, setErreur] = useState('');

  const charger = useCallback(async () => {
    try {
      const { statut, json } = await appeler('/signature/dossiers');
      if (statut === 401) return onSessionExpiree();
      if (statut === 503) return setErreur(json.erreur || 'Module de signature non configuré sur l’API.');
      if (statut !== 200) return setErreur('Dossiers momentanément indisponibles.');
      setErreur('');
      return setDossiers(json.dossiers);
    } catch {
      return setErreur('Service injoignable.');
    }
  }, [appeler, onSessionExpiree]);

  useEffect(() => {
    charger();
  }, [charger]);

  // Un dossier créé, annulé ou rangé ailleurs change aussi ce que montrent l'écran Documents et les fiches projet.
  const actualiser = useCallback(() => {
    onCoffreChange();
    return charger();
  }, [charger, onCoffreChange]);

  return (
    <div className="tdb-signatures">
      <TitreRevele texte="Signatures électroniques" className="tdb-signatures__h1" />
      <p className="tdb-signatures__intro">
        Chaque signataire reçoit un lien personnel, lit le document, confirme son identité par un code reçu par e-mail et signe. Le document final (page de signatures + certificat de preuve) part à tout le monde, avec copie pour toi.
      </p>
      {erreur && <p className="tdb-signatures__erreur tdb-signatures__erreur--page">{erreur}</p>}
      <Formulaire appeler={appeler} projets={projets} onCree={actualiser} onSessionExpiree={onSessionExpiree} />
      <Panneau titre="Dossiers" compteur={dossiers ? dossiers.length : undefined} id="tdb-signatures-dossiers" i={1}>
        {dossiers === null ? (
          <p className="tdb-ligne__detail">Chargement…</p>
        ) : dossiers.length === 0 ? (
          <p className="tdb-ligne__detail">Aucun dossier pour l’instant.</p>
        ) : (
          <ul className="tdb-signatures__dossiers">
            {dossiers.map((d) => (
              <Dossier key={d.id} dossier={d} projets={projets} appeler={appeler} onChange={actualiser} onSessionExpiree={onSessionExpiree} />
            ))}
          </ul>
        )}
      </Panneau>
    </div>
  );
};

export default Signatures;
