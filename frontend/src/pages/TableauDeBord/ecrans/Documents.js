import React, { useMemo, useState } from 'react';
import { FormulaireDocument, ListeDocuments, TYPES_DOCUMENT } from '../composants/Documents';
import { Bouton, Onglets, Panneau, TitreRevele } from '../composants/elements';
import { etatPeriode } from '../echeances';
import { formaterEuros, sansAccents } from '../outils';

// Écran « Documents » : tout le coffre au même endroit. Les contrats envoyés depuis l'écran Signatures s'y rangent
// seuls, « en attente de signature » puis « signés » ; les factures, devis et autres documents s'y déposent à la
// main. Filtres par type, par projet et par texte. Un clic ouvre le document dans un nouvel onglet.

const pluriel = (n, un, plusieurs = `${un}s`) => `${n} ${n > 1 ? plusieurs : un}`;

const Documents = ({ appeler, coffre, projets, onChangement, onSessionExpiree, naviguer }) => {
  const [type, setType] = useState('tous');
  const [projet, setProjet] = useState('tous');
  const [recherche, setRecherche] = useState('');
  const [ajout, setAjout] = useState(false);

  const lu = coffre && coffre !== 'erreur' ? coffre : null;
  const documents = lu?.documents || [];

  // Projets qui ont au moins un document, dans l'ordre alphabétique ; « Sans projet » s'il en reste à ranger.
  const projetsDuCoffre = useMemo(() => {
    const slugs = new Set(documents.map((d) => d.projet).filter(Boolean));
    return [...slugs].map((slug) => ({ slug, nom: projets.find((p) => p.slug === slug)?.nom || slug })).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  }, [documents, projets]);
  const sansProjet = documents.some((d) => !d.projet);

  const duProjet = documents.filter((d) => projet === 'tous' || (projet === 'aucun' ? !d.projet : d.projet === projet));
  const texte = sansAccents(recherche.trim());
  const correspond = (d) =>
    !texte || sansAccents([d.titre, d.reference, d.note, ...(d.signataires || []), projets.find((p) => p.slug === d.projet)?.nom || '', d.statut === 'en_attente' ? 'en attente de signature' : ''].join(' ')).includes(texte);
  const visibles = duProjet.filter((d) => (type === 'tous' || d.type === type) && correspond(d));

  const compter = (cle) => duProjet.filter((d) => d.type === cle).length;
  const onglets = [{ cle: 'tous', libelle: `Tous · ${duProjet.length}` }, ...Object.entries(TYPES_DOCUMENT).map(([cle, t]) => ({ cle, libelle: `${t.pluriel} · ${compter(cle)}` }))];
  // Total des factures affichées ; celles déposées sans montant sont signalées plutôt que comptées pour zéro.
  const factures = visibles.filter((d) => d.type === 'facture');
  const chiffrees = factures.filter((d) => d.montant);
  const totalFactures = chiffrees.reduce((s, d) => s + d.montant, 0);
  const sansMontant = factures.length - chiffrees.length;
  const enAttente = visibles.filter((d) => d.statut === 'en_attente').length;
  // Périodes qui demandent un geste ou un coup d'œil : à renouveler, fin proche, échues.
  const aSuivre = visibles.filter((d) => {
    const etat = etatPeriode(d.periode);
    return etat?.badge && etat.ton !== 'neutre';
  }).length;

  return (
    <div className="tdb-ecran tdb-documents">
      <TitreRevele texte="Documents" className="tdb-documents__h1" />
      <p className="tdb-documents__intro">
        Le coffre de tes projets. Un contrat envoyé depuis Signatures s’y range tout seul, en attente de signature puis signé ; factures, devis et autres documents se déposent ici ou depuis la fiche d’un projet. Un clic ouvre le document dans un nouvel onglet ; le crayon lui donne une période et des dates à suivre, rappelées à l’approche. Chaque fichier est stocké chiffré.
      </p>

      <Panneau
        titre="Coffre"
        compteur={lu ? documents.length : undefined}
        id="tdb-documents-coffre"
        className="tdb-documents__coffre"
        i={0}
        action={
          lu && !ajout ? (
            <Bouton icone="plus" onClick={() => setAjout(true)}>
              Ajouter un document
            </Bouton>
          ) : null
        }
      >
        {ajout && (
          <div className="tdb-documents__depot">
            <p className="tdb-documents__intertitre">Nouveau document</p>
            <FormulaireDocument
              appeler={appeler}
              projets={projets}
              onSessionExpiree={onSessionExpiree}
              onAnnuler={() => setAjout(false)}
              onEnregistre={() => {
                setAjout(false);
                onChangement();
              }}
            />
          </div>
        )}

        {coffre === null && <p className="tdb-vide">Lecture du coffre…</p>}
        {coffre === 'erreur' && <p className="tdb-vide tdb-vide--erreur">Coffre momentanément illisible. Réessaie dans un instant.</p>}
        {lu && documents.length === 0 && (
          <p className="tdb-vide">Le coffre est vide. Un contrat s’y range dès son envoi depuis l’écran Signatures ; pour une facture ou tout autre document, utilise « Ajouter un document ».</p>
        )}

        {lu && documents.length > 0 && (
          <>
            <div className="tdb-documents__filtres">
              <Onglets libelle="Type de document" elements={onglets} actif={type} onChoisir={setType} />
              <div className="tdb-documents__tri">
                <label className="tdb-champ tdb-documents__filtre">
                  <span className="tdb-visuellement-cache">Projet</span>
                  <select className="tdb-champ__saisie tdb-champ__saisie--liste" value={projet} onChange={(e) => setProjet(e.target.value)}>
                    <option value="tous">Tous les projets</option>
                    {projetsDuCoffre.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.nom}
                      </option>
                    ))}
                    {sansProjet && <option value="aucun">Sans projet</option>}
                  </select>
                </label>
                <label className="tdb-champ tdb-documents__filtre tdb-documents__filtre--recherche">
                  <span className="tdb-visuellement-cache">Rechercher un document</span>
                  <input className="tdb-champ__saisie" type="search" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher un document" title="Titre, référence, projet, signataire, note" />
                </label>
              </div>
            </div>
            <p className="tdb-documents__resume" role="status">
              {pluriel(visibles.length, 'document')}
              {enAttente > 0 && ` · ${pluriel(enAttente, 'contrat')} en attente de signature`}
              {aSuivre > 0 && ` · ${pluriel(aSuivre, 'échéance')} à suivre`}
              {chiffrees.length > 0 && ` · ${pluriel(chiffrees.length, 'facture')} pour ${formaterEuros(totalFactures, { centimes: true })}`}
              {chiffrees.length > 0 && sansMontant > 0 && ` (+ ${sansMontant} sans montant)`}
            </p>
            {visibles.length ? (
              <ListeDocuments documents={visibles} projets={projets} appeler={appeler} onChangement={onChangement} onSessionExpiree={onSessionExpiree} naviguer={naviguer} />
            ) : (
              <p className="tdb-vide">Aucun document ne correspond à ces filtres.</p>
            )}
          </>
        )}
      </Panneau>
    </div>
  );
};

export default Documents;
