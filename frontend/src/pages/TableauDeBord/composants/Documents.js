import React, { useState } from 'react';
import { Badge, Bouton } from './elements';
import Icone from './Icone';
import { CHEMINS, URL_API_TABLEAU_DE_BORD } from '../constantes';
import { A_ECHEANCE, aujourdhuiParis, dansJours, DATES_CLES_MAX, datesClesDe, decrirePeriode, etatPeriode, PERIODE_VIDE } from '../echeances';
import { formaterDateLongue, formaterEuros } from '../outils';

// Coffre de documents : les contrats du module de signature (signés, ou encore en attente de signature) et les
// documents déposés à la main (factures, devis, autres), rangés par projet. Composants partagés par l'écran
// « Documents », le panneau « Documents » de chaque fiche projet et l'écran « Signatures ». Les fichiers sont
// chiffrés côté API ; un clic les ouvre dans un nouvel onglet, sans les télécharger. Chaque document peut porter
// une période (« du … au …, à renouveler ») et des dates clés, rappelées à l'approche (echeances.js).

export const TYPES_DOCUMENT = {
  contrat: { libelle: 'Contrat', pluriel: 'Contrats', icone: 'contrat' },
  facture: { libelle: 'Facture', pluriel: 'Factures', icone: 'euro' },
  devis: { libelle: 'Devis', pluriel: 'Devis', icone: 'document' },
  autre: { libelle: 'Autre', pluriel: 'Autres', icone: 'dossier' },
};
const TAILLE_MAX = 8 * 1024 * 1024;
const FORMATS_ACCEPTES = 'application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg';

const lireBase64 = (fichier) =>
  new Promise((resoudre, rejeter) => {
    const lecteur = new FileReader();
    lecteur.onload = () => resoudre(String(lecteur.result).split(',')[1] || '');
    lecteur.onerror = () => rejeter(new Error('Lecture du fichier impossible.'));
    lecteur.readAsDataURL(fichier);
  });

/** Nom de fichier lisible tiré d'un titre : « Contrat de création du site » → « Contrat-de-création-du-site.pdf ». */
export const nomDeFichier = (titre, suffixe = '', extension = 'pdf') => `${String(titre).replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 80) || 'document'}${suffixe}.${extension}`;

/** Télécharge un fichier de l'API (session du tableau de bord) et l'enregistre sous `nom`. */
export async function telechargerFichier(chemin, nom) {
  const reponse = await fetch(`${URL_API_TABLEAU_DE_BORD}${chemin}`, { credentials: 'include' });
  if (reponse.status === 401) throw Object.assign(new Error('Session expirée : reconnecte-toi.'), { session: true });
  if (reponse.status !== 200) throw new Error(`Téléchargement impossible (HTTP ${reponse.status}).`);
  const url = URL.createObjectURL(await reponse.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Adresse d'un fichier de l'API à ouvrir dans un nouvel onglet : la visionneuse du navigateur l'affiche sans
 * l'enregistrer. L'API reconnaît la session par son cookie (même site) et refuse tout sans elle.
 */
export const adresseApercu = (chemin) => `${URL_API_TABLEAU_DE_BORD}${chemin}?apercu=1`;

/** Bouton-lien « ouvrir dans un nouvel onglet » vers un fichier de l'API. */
export const LienApercu = ({ chemin, variante = 'secondaire', className = '', children }) => (
  <a className={`tdb-bouton tdb-bouton--${variante} ${className}`.trim()} href={adresseApercu(chemin)} target="_blank" rel="noopener noreferrer" title="Ouvrir dans un nouvel onglet">
    <Icone nom="lien-externe" taille={16} />
    <span>{children}</span>
  </a>
);

const parNom = (projets) => [...projets].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

/** Liste déroulante des projets de l'inventaire ; la première ligne (`vide`) vaut « aucun projet ». */
export const ChoixProjet = ({ projets, valeur, onChange, vide = 'Sans projet', ...reste }) => (
  <select className="tdb-champ__saisie tdb-champ__saisie--liste" value={valeur} onChange={(e) => onChange(e.target.value)} {...reste}>
    <option value="">{vide}</option>
    {/* Projet retiré de l'inventaire depuis le rangement : il reste choisi, sous son identifiant. */}
    {valeur && !projets.some((p) => p.slug === valeur) && <option value={valeur}>{valeur}</option>}
    {parNom(projets).map((p) => (
      <option key={p.slug} value={p.slug}>
        {p.nom}
      </option>
    ))}
  </select>
);

const aUnePeriode = (periode) => Boolean(periode && (periode.debut || periode.fin || periode.aEcheance || periode.datesCles?.length));

/**
 * Période telle qu'elle part à l'API : { valeur }, ou { erreur } à montrer. Une ligne de date clé laissée
 * entièrement vide est ignorée ; une ligne à moitié remplie est signalée.
 */
export function periodePourEnvoi(periode) {
  const remplies = periode.datesCles.filter((d) => d.date || d.libelle.trim());
  if (remplies.some((d) => !d.date || !d.libelle.trim())) return { erreur: 'Chaque date clé a besoin d’une date et d’un libellé.' };
  if (periode.debut && periode.fin && periode.fin < periode.debut) return { erreur: 'La fin de la période précède son début.' };
  return { valeur: { debut: periode.debut, fin: periode.fin, aEcheance: periode.fin ? periode.aEcheance : '', datesCles: remplies.map((d) => ({ date: d.date, libelle: d.libelle.trim() })) } };
}

/**
 * Période d'un document : début, fin, ce qui se passe à l'échéance, et dates clés libres (fin d'une maintenance
 * offerte, échéance de paiement…). Champs contrôlés : `periode` = { debut, fin, aEcheance, datesCles }.
 * Repliée tant qu'elle est vide, pour ne pas alourdir le dépôt d'une simple facture.
 */
export const ChampsPeriode = ({ periode, onChange, deplie = false }) => {
  const [ouvert, setOuvert] = useState(deplie || aUnePeriode(periode));
  const modifier = (champ, valeur) => onChange({ ...periode, [champ]: valeur });
  const modifierDate = (rang, champ, valeur) => modifier('datesCles', periode.datesCles.map((d, k) => (k === rang ? { ...d, [champ]: valeur } : d)));
  if (!ouvert) {
    return (
      <div className="tdb-periode tdb-periode--repliee">
        <Bouton variante="fantome" icone="calendrier" onClick={() => setOuvert(true)}>
          Ajouter une période ou des dates à suivre
        </Bouton>
      </div>
    );
  }
  return (
    <fieldset className="tdb-periode">
      <legend className="tdb-periode__titre">Période et dates à suivre (facultatif)</legend>
      <div className="tdb-periode__grille">
        <label className="tdb-champ">
          <span className="tdb-champ__libelle">Début</span>
          <input className="tdb-champ__saisie" type="date" value={periode.debut} onChange={(e) => modifier('debut', e.target.value)} />
        </label>
        <label className="tdb-champ">
          <span className="tdb-champ__libelle">Fin</span>
          <input className="tdb-champ__saisie" type="date" value={periode.fin} min={periode.debut || undefined} onChange={(e) => modifier('fin', e.target.value)} />
        </label>
        <label className="tdb-champ">
          <span className="tdb-champ__libelle">À la fin</span>
          <select className="tdb-champ__saisie tdb-champ__saisie--liste" value={periode.aEcheance} onChange={(e) => modifier('aEcheance', e.target.value)} disabled={!periode.fin}>
            {A_ECHEANCE.map((a) => (
              <option key={a.cle} value={a.cle}>
                {a.libelle}
              </option>
            ))}
          </select>
        </label>
      </div>
      {periode.datesCles.length > 0 && (
        <ul className="tdb-periode__dates">
          {periode.datesCles.map((d, rang) => (
            <li key={rang} className="tdb-periode__date">
              <input className="tdb-champ__saisie" type="date" value={d.date} onChange={(e) => modifierDate(rang, 'date', e.target.value)} aria-label={`Date clé ${rang + 1}`} />
              <input className="tdb-champ__saisie" value={d.libelle} onChange={(e) => modifierDate(rang, 'libelle', e.target.value)} maxLength={120} placeholder="Fin de la maintenance offerte" aria-label={`Libellé de la date clé ${rang + 1}`} />
              <button type="button" className="tdb-icone-bouton" onClick={() => modifier('datesCles', periode.datesCles.filter((_, k) => k !== rang))} aria-label={`Retirer la date clé ${rang + 1}`} title="Retirer cette date">
                <Icone nom="corbeille" taille={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="tdb-periode__ajout">
        <Bouton variante="fantome" icone="plus" onClick={() => modifier('datesCles', [...periode.datesCles, { date: '', libelle: '' }])} disabled={periode.datesCles.length >= DATES_CLES_MAX}>
          Ajouter une date clé
        </Bouton>
      </div>
    </fieldset>
  );
};

/**
 * Formulaire du coffre. Sans `document` : dépôt d'un nouveau fichier. Avec un document déposé : ses informations.
 * Avec un contrat du module de signature (signé ou en attente) : son rangement dans un projet, sa période et ses
 * dates clés ; le document et ses preuves ne se modifient pas.
 * `projetImpose` : dépôt depuis une fiche projet, le projet n'est pas demandé.
 */
export const FormulaireDocument = ({ appeler, projets, document: existant = null, projetImpose, onEnregistre, onAnnuler, onSessionExpiree }) => {
  // Contrat du module de signature (signé ou en attente) : seuls son rangement et ses dates se modifient.
  const signe = existant?.source === 'signature';
  const [periode, setPeriode] = useState(() => ({ ...PERIODE_VIDE, ...(existant?.periode || {}), datesCles: (existant?.periode?.datesCles || []).map((d) => ({ ...d })) }));
  const [fichier, setFichier] = useState(null);
  const [type, setType] = useState(existant?.type || 'facture');
  const [titre, setTitre] = useState(existant?.titre || '');
  const [projet, setProjet] = useState(existant ? existant.projet : projetImpose || '');
  const [reference, setReference] = useState(existant?.reference || '');
  const [date, setDate] = useState(existant?.dateSaisie || '');
  const [montant, setMontant] = useState(existant?.montant ? String(existant.montant).replace('.', ',') : '');
  const [note, setNote] = useState(existant?.note || '');
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState('');

  const choisirFichier = (choisi) => {
    setFichier(choisi);
    setErreur(choisi && choisi.size > TAILLE_MAX ? 'Ce fichier dépasse 8 Mo.' : '');
    // Titre proposé d'après le nom du fichier, tant que rien n'a été saisi.
    if (choisi && !titre.trim()) setTitre(choisi.name.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim().slice(0, 200));
  };

  const pret = signe || (titre.trim().length >= 2 && (existant || (fichier && fichier.size <= TAILLE_MAX)));

  const enregistrer = async (e) => {
    e.preventDefault();
    setErreur('');
    let euros = null;
    if (!signe && montant.trim()) {
      euros = Number(montant.replace(/[\s €]/g, '').replace(',', '.'));
      if (!Number.isFinite(euros) || euros < 0) return setErreur('Montant illisible : écris par exemple 354 ou 354,50.');
    }
    const dates = periodePourEnvoi(periode);
    if (dates.erreur) return setErreur(dates.erreur);
    setOccupe(true);
    try {
      const champs = { titre: titre.trim(), type, projet, reference: reference.trim(), date, montant: euros, note: note.trim(), ...dates.valeur };
      let reponse;
      if (signe) reponse = await appeler(`/signature/dossiers/${existant.id}/classement`, { methode: 'POST', corps: { projet, ...dates.valeur } });
      else if (existant) reponse = await appeler(`/documents/${existant.id}/modifier`, { methode: 'POST', corps: champs });
      else reponse = await appeler('/documents', { methode: 'POST', corps: { ...champs, nomFichier: fichier.name.slice(0, 200), fichier: await lireBase64(fichier) } });
      if (reponse.statut === 401) return onSessionExpiree();
      if (reponse.statut !== 200) throw new Error(reponse.json.erreur || `Enregistrement refusé (HTTP ${reponse.statut}).`);
      return onEnregistre();
    } catch (erreurEnvoi) {
      return setErreur(erreurEnvoi.message === 'Failed to fetch' ? 'Service injoignable. Réessaie dans un instant.' : erreurEnvoi.message);
    } finally {
      setOccupe(false);
    }
  };

  return (
    <form className="tdb-documents__formulaire" onSubmit={enregistrer} noValidate>
      {signe ? (
        <>
          <p className="tdb-vide">Ce contrat vient du module de signature : le document et ses preuves ne se modifient pas. Tu choisis ici son projet, sa période et les dates à suivre.</p>
          <label className="tdb-champ tdb-documents__projet-seul">
            <span className="tdb-champ__libelle">Projet</span>
            <ChoixProjet projets={projets} valeur={projet} onChange={setProjet} />
          </label>
          <ChampsPeriode periode={periode} onChange={setPeriode} deplie />
        </>
      ) : (
        <div className="tdb-documents__grille">
          {!existant && (
            <label className="tdb-champ tdb-documents__large">
              <span className="tdb-champ__libelle">Fichier (PDF, PNG ou JPEG, 8 Mo au plus)</span>
              <input className="tdb-champ__saisie tdb-champ__saisie--fichier" type="file" accept={FORMATS_ACCEPTES} onChange={(e) => choisirFichier(e.target.files?.[0] || null)} />
            </label>
          )}
          <label className="tdb-champ">
            <span className="tdb-champ__libelle">Type</span>
            <select className="tdb-champ__saisie tdb-champ__saisie--liste" value={type} onChange={(e) => setType(e.target.value)}>
              {Object.entries(TYPES_DOCUMENT).map(([cle, t]) => (
                <option key={cle} value={cle}>
                  {t.libelle}
                </option>
              ))}
            </select>
          </label>
          {projetImpose && !existant ? null : (
            <label className="tdb-champ">
              <span className="tdb-champ__libelle">Projet</span>
              <ChoixProjet projets={projets} valeur={projet} onChange={setProjet} />
            </label>
          )}
          <label className={`tdb-champ${projetImpose && !existant ? '' : ' tdb-documents__large'}`}>
            <span className="tdb-champ__libelle">Titre</span>
            <input className="tdb-champ__saisie" value={titre} onChange={(e) => setTitre(e.target.value)} maxLength={200} placeholder="Facture F-2026-014 · acompte" required />
          </label>
          <label className="tdb-champ">
            <span className="tdb-champ__libelle">Référence (facultatif)</span>
            <input className="tdb-champ__saisie" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={120} placeholder="F-2026-014" />
          </label>
          <label className="tdb-champ">
            <span className="tdb-champ__libelle">Date du document (facultatif)</span>
            <input className="tdb-champ__saisie" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="tdb-champ">
            <span className="tdb-champ__libelle">Montant en euros (facultatif)</span>
            <input className="tdb-champ__saisie" inputMode="decimal" value={montant} onChange={(e) => setMontant(e.target.value)} maxLength={14} placeholder="354,00" />
          </label>
          <label className="tdb-champ">
            <span className="tdb-champ__libelle">Note (facultatif)</span>
            <input className="tdb-champ__saisie" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="Payée le 12/11 par virement" />
          </label>
          <div className="tdb-documents__large">
            <ChampsPeriode periode={periode} onChange={setPeriode} />
          </div>
        </div>
      )}
      <div className="tdb-documents__actions">
        <Bouton type="submit" icone={existant ? 'valide' : 'plus'} disabled={!pret || occupe}>
          {occupe ? 'Enregistrement…' : existant ? 'Enregistrer' : 'Déposer dans le coffre'}
        </Bouton>
        <Bouton variante="fantome" onClick={onAnnuler} disabled={occupe}>
          Annuler
        </Bouton>
      </div>
      <p className="tdb-documents__erreur" role="alert">
        {erreur}
      </p>
    </form>
  );
};

/**
 * Un document du coffre : ce qu'il est, où il est rangé, et ses actions. Un clic sur le titre ou sur « Ouvrir »
 * l'affiche dans un nouvel onglet ; la flèche l'enregistre. Un contrat du module de signature porte son état :
 * « Contrat signé », ou « En attente de signature » avec le nom de ceux qui doivent encore signer (le fichier
 * est alors le PDF d'origine).
 */
export const LigneDocument = ({ document: d, projets, appeler, onChangement, onSessionExpiree, naviguer, montrerProjet = true, i = 0 }) => {
  const [edition, setEdition] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState('');
  const type = TYPES_DOCUMENT[d.type] || TYPES_DOCUMENT.autre;
  const contrat = d.source === 'signature';
  const enAttente = contrat && d.statut === 'en_attente';
  const signe = contrat && !enAttente;
  const projet = projets.find((p) => p.slug === d.projet);
  const lienInterne = (chemin) => (e) => {
    if (!naviguer || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    naviguer(chemin);
  };

  const action = async (fn) => {
    setErreur('');
    setOccupe(true);
    try {
      await fn();
    } catch (e) {
      if (e.session) return onSessionExpiree();
      setErreur(e.message === 'Failed to fetch' ? 'Service injoignable. Réessaie dans un instant.' : e.message || 'Action impossible.');
    } finally {
      setOccupe(false);
    }
    return undefined;
  };
  const telecharger = () => action(() => telechargerFichier(d.chemin, nomDeFichier(d.titre, signe ? '-signe' : '', d.format || 'pdf')));
  const supprimer = () =>
    action(async () => {
      if (!window.confirm(`Supprimer « ${d.titre} » du coffre ? Le fichier sera effacé définitivement.`)) return undefined;
      const { statut, json } = await appeler(`/documents/${d.id}/supprimer`, { methode: 'POST' });
      if (statut === 401) return onSessionExpiree();
      if (statut !== 200) throw new Error(json.erreur || `Suppression refusée (HTTP ${statut}).`);
      return onChangement();
    });
  const nombreSignataires = d.signataires?.length || 0;
  const nombreSignes = nombreSignataires - (d.restants?.length || 0);
  const quand = signe ? `signé le ${formaterDateLongue(d.date)}` : enAttente ? `envoyé le ${formaterDateLongue(d.date)}` : formaterDateLongue(d.date);
  const details = [
    d.reference,
    quand,
    d.montant ? formaterEuros(d.montant, { centimes: true }) : null,
    signe && nombreSignataires ? `par ${d.signataires.join(', ')}` : null,
    enAttente && nombreSignataires ? `${nombreSignes} signature${nombreSignes > 1 ? 's' : ''} sur ${nombreSignataires}` : null,
  ].filter(Boolean);
  const etat = signe ? 'en-ligne' : enAttente ? 'alerte' : null;
  // Période (« du … au … »), où elle en est aujourd'hui (« à renouveler dans 23 jours ») et dates clés.
  const aujourdhui = aujourdhuiParis();
  const periodeEnClair = decrirePeriode(d.periode, aujourdhui);
  const echeance = etatPeriode(d.periode, aujourdhui);
  const datesCles = datesClesDe(d.periode, aujourdhui);

  return (
    <li className={`tdb-document${enAttente ? ' tdb-document--en-attente' : ''}`} style={{ '--i': Math.min(i, 12) }}>
      <div className="tdb-document__ligne">
        <span className={`tdb-ligne__icone${etat ? ` tdb-ligne__icone--${etat}` : ''}`}>
          <Icone nom={type.icone} taille={16} />
        </span>
        <div className="tdb-document__textes">
          <p className="tdb-document__titre">
            <a href={adresseApercu(d.chemin)} target="_blank" rel="noopener noreferrer" title="Ouvrir dans un nouvel onglet">
              {d.titre}
            </a>
          </p>
          <p className="tdb-document__detail">
            {montrerProjet &&
              (projet ? (
                <a className="tdb-document__projet" href={CHEMINS.fiche(projet.slug)} onClick={lienInterne(CHEMINS.fiche(projet.slug))}>
                  {projet.nom}
                </a>
              ) : (
                <span className="tdb-document__projet tdb-document__projet--aucun">{d.projet || 'Sans projet'}</span>
              ))}
            {montrerProjet && details.length > 0 && ' · '}
            {details.join(' · ')}
          </p>
          {enAttente && (
            <p className="tdb-document__note">
              {d.restants?.length ? `Reste à signer : ${d.restants.join(', ')}. ` : ''}
              <a className="tdb-document__suivi" href={CHEMINS.signatures} onClick={lienInterne(CHEMINS.signatures)}>
                Suivre ou relancer dans Signatures
              </a>
            </p>
          )}
          {(periodeEnClair || echeance) && (
            <p className="tdb-document__periode">
              <Icone nom="calendrier" taille={14} />
              <span>
                {periodeEnClair && `${periodeEnClair.charAt(0).toUpperCase()}${periodeEnClair.slice(1)}`}
                {periodeEnClair && echeance && ' · '}
                {echeance && <strong className={`tdb-document__echeance tdb-document__echeance--${echeance.ton}`}>{echeance.texte}</strong>}
              </span>
            </p>
          )}
          {datesCles.length > 0 && (
            <ul className="tdb-document__dates">
              {datesCles.map((c) => (
                <li key={`${c.date}-${c.libelle}`} className={`tdb-document__date${c.jours < 0 ? ' tdb-document__date--passee' : c.jours <= 30 ? ' tdb-document__date--proche' : ''}`}>
                  <span className="tdb-document__jour">{formaterDateLongue(c.date)}</span>
                  <span>{c.libelle}</span>
                  <span className="tdb-document__delai">{c.jours < 0 ? 'passée' : dansJours(c.jours)}</span>
                </li>
              ))}
            </ul>
          )}
          {d.note && <p className="tdb-document__note">{d.note}</p>}
        </div>
        <div className="tdb-document__actions">
          {echeance?.badge && <Badge ton={echeance.ton}>{echeance.badge}</Badge>}
          <Badge ton={etat || 'neutre'}>{signe ? 'Contrat signé' : enAttente ? 'En attente de signature' : type.libelle}</Badge>
          <div className="tdb-document__boutons">
            <LienApercu chemin={d.chemin} className="tdb-document__ouvrir">
              Ouvrir
            </LienApercu>
            <button type="button" className="tdb-icone-bouton" onClick={telecharger} aria-label={`Télécharger « ${d.titre} »`} title="Télécharger" disabled={occupe}>
              <Icone nom="telechargement" taille={16} />
            </button>
            <button type="button" className="tdb-icone-bouton" onClick={() => setEdition((v) => !v)} aria-expanded={edition} aria-label={contrat ? `Projet et dates de « ${d.titre} »` : `Modifier « ${d.titre} »`} title={contrat ? 'Projet et dates' : 'Modifier'} disabled={occupe}>
              <Icone nom="crayon" taille={16} />
            </button>
            {!contrat && (
              <button type="button" className="tdb-icone-bouton tdb-document__supprimer" onClick={supprimer} aria-label={`Supprimer « ${d.titre} »`} title="Supprimer" disabled={occupe}>
                <Icone nom="corbeille" taille={16} />
              </button>
            )}
          </div>
        </div>
      </div>
      {edition && (
        <FormulaireDocument
          appeler={appeler}
          projets={projets}
          document={d}
          onSessionExpiree={onSessionExpiree}
          onAnnuler={() => setEdition(false)}
          onEnregistre={() => {
            setEdition(false);
            onChangement();
          }}
        />
      )}
      {erreur && (
        <p className="tdb-documents__erreur" role="alert">
          {erreur}
        </p>
      )}
    </li>
  );
};

/** Liste de documents du coffre. */
export const ListeDocuments = ({ documents, ...reste }) => (
  <ul className="tdb-documents__liste">
    {documents.map((d, i) => (
      <LigneDocument key={`${d.source}-${d.id}`} document={d} i={i} {...reste} />
    ))}
  </ul>
);
