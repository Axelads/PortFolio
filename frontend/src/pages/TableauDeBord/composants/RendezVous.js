import React from 'react';
import Barres from './Barres';
import { Compteur } from './elements';
import { formaterJourMois, formaterNombre } from '../outils';

// Prise de rendez-vous d'un site de praticien (Harmovità), calculée par l'API (src/mesure/rendezVous.js) à partir des
// clics mesurés : bouton « Prendre rendez-vous », rendez-vous confirmé dans l'agenda du site, départ vers l'agenda
// externe, appel. Une « personne » est l'empreinte anonyme du jour, comme un visiteur : les taux restent comparables.

const personnes = (n) => `${formaterNombre(n)} personne${n > 1 ? 's' : ''}`;
/** Taux à une décimale : sur un petit site, 2,5 % et 3 % ne disent pas la même chose. */
const taux = (part, total) => `${(total ? (part / total) * 100 : 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;

export default function RendezVous({ r, depuis }) {
  const hote = r.agendaExterne.hotes[0]?.nom || 'l’agenda externe';
  const tuiles = [
    ['Clics « Prendre rendez-vous »', r.boutons.clics, `${personnes(r.boutons.personnes)} · ${taux(r.boutons.personnes, r.visiteurs)} des visiteurs`],
    ['Rendez-vous confirmés', r.reservations.clics, 'pris dans l’agenda du site (Cal.com)'],
    [`Départs vers ${hote}`, r.agendaExterne.clics, 'la réservation s’y termine, on ne la voit pas'],
    ['Appels lancés', r.appels.clics, 'clic sur le numéro de téléphone'],
  ];
  const apresClic = r.tauxApresClic === null ? 'aucun clic sur le bouton' : `${taux(r.apresClic, r.boutons.personnes)} après un clic sur le bouton`;

  return (
    <section className="tdb-freq__rdv" aria-labelledby="tdb-rdv-titre">
      <div className="tdb-freq__serveur-tete">
        <h3 id="tdb-rdv-titre" className="tdb-freq__sous-titre">Prise de rendez-vous</h3>
        <p className="tdb-avis__meta">
          Comptée depuis le {formaterJourMois(depuis)} · une personne = une empreinte anonyme du jour, comme un visiteur · un rendez-vous pris sur Résalib ou par téléphone sans passer par le site n’apparaît pas
        </p>
      </div>

      <div className="tdb-chiffres tdb-freq__chiffres">
        {tuiles.map(([libelle, valeur, contexte], i) => (
          <div key={libelle} className="tdb-chiffres__bloc">
            <p className="tdb-chiffres__libelle">{libelle}</p>
            <p className="tdb-chiffres__valeur">
              <Compteur valeur={valeur} delai={i * 60} />
            </p>
            <p className="tdb-chiffres__contexte">{contexte}</p>
          </div>
        ))}
        <div className="tdb-chiffres__bloc">
          <p className="tdb-chiffres__libelle">Taux de concrétisation</p>
          <p className="tdb-chiffres__valeur">{taux(r.ontReserve, r.visiteurs)}</p>
          <p className="tdb-chiffres__contexte">des visiteurs ont réservé · {apresClic}</p>
        </div>
      </div>

      <div className="tdb-freq__grille">
        <Barres
          titre="Du visiteur au rendez-vous"
          total={r.visiteurs}
          elements={[
            { cle: 'visiteurs', libelle: 'Visiteurs', valeur: r.visiteurs },
            { cle: 'bouton', libelle: 'Ont cliqué « Prendre rendez-vous »', valeur: r.boutons.personnes },
            { cle: 'reserve', libelle: 'Ont réservé', valeur: r.ontReserve, detail: `${formaterNombre(r.reservations.personnes)} sur le site · ${formaterNombre(r.agendaExterne.personnes)} vers ${hote}` },
          ]}
        />
        <Barres titre="Séances réservées sur le site" elements={r.reservations.seances.map((s) => ({ cle: s.nom, libelle: s.nom, valeur: s.nombre }))} vide="Aucun rendez-vous confirmé sur la période." />
        <Barres titre="D’où viennent ceux qui réservent" total={r.ontReserve} elements={r.origines.map((o) => ({ cle: o.type, libelle: o.libelle, valeur: o.nombre }))} vide="Personne n’a encore réservé sur la période." />
      </div>
    </section>
  );
}
