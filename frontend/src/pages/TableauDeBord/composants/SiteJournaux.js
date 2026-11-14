import React from 'react';
import Courbe from './Courbe';
import { Repartition } from './DonneesPocketbase';
import { formaterHeure, formaterJourMois, formaterNombre, nomPays } from '../outils';

const compter = (n, un, plusieurs = `${un}s`) => `${formaterNombre(n)} ${n > 1 ? plusieurs : un}`;
const enBarres = (liste, cle = 'nom') => liste.map((e) => ({ cle: e[cle] || 'inconnu', libelle: e[cle], valeur: e.nombre }));

/**
 * Fréquentation d'un site lue dans les journaux de son hébergeur (GET /sites) : visiteurs, pages vues et clics vers
 * les stores des 30 derniers jours, jour par jour, puis d'où viennent les visiteurs. Rien n'est ajouté au site : c'est
 * le même comptage que l'outil marketing du projet. Un jour sans journal est dit « pas encore publié », jamais zéro.
 */
export default function SiteJournaux({ site, verifieLe }) {
  const { jours, total, store, periode } = site;
  if (!site.joursLus) return <p className="tdb-vide">Aucun journal lisible sur les {periode.jours} derniers jours.</p>;
  const lus = jours.filter((j) => !j.absent);
  // Hier : la dernière journée complète (celle d'aujourd'hui se remplit encore).
  const hier = jours.at(-2) && !jours.at(-2).absent ? jours.at(-2) : null;
  const chiffres = [
    ['Visiteurs · 30 j', total.visiteurs, `${formaterNombre(Math.round(total.visiteurs / lus.length))} par jour en moyenne`],
    ['Pages vues · 30 j', total.pagesVues, total.visiteurs ? `${(total.pagesVues / total.visiteurs).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} par visiteur` : 'aucun visiteur'],
  ];
  if (site.passageStore) chiffres.push(['Clics vers les stores · 30 j', store.total, 'boutons, badges et QR codes']);
  if (hier) chiffres.push(['Hier', hier.visiteurs, `${hier.visiteurs > 1 ? 'visiteurs' : 'visiteur'} · ${compter(hier.pagesVues, 'page vue', 'pages vues')}`]);

  const detail = (j, i) =>
    [compter(j.pagesVues, 'page vue', 'pages vues'), site.passageStore && j.passages ? compter(j.passages, 'clic vers les stores', 'clics vers les stores') : null, i === jours.length - 1 ? 'journée en cours' : null]
      .filter(Boolean)
      .join(' · ');

  return (
    <div className="tdb-trafic">
      <div className="tdb-chiffres">
        {chiffres.map(([libelle, valeur, contexte]) => (
          <div key={libelle} className="tdb-chiffres__bloc">
            <p className="tdb-chiffres__libelle">{libelle}</p>
            <p className="tdb-chiffres__valeur">{formaterNombre(valeur)}</p>
            <p className="tdb-chiffres__contexte">{contexte}</p>
          </div>
        ))}
      </div>
      <figure className="tdb-ios__courbe">
        <Courbe
          points={jours.map((j, i) => ({ jour: j.jour, valeur: j.visiteurs, absent: j.absent, detail: j.absent ? null : detail(j, i) }))}
          unite={['visiteur', 'visiteurs']}
          libelle={`Visiteurs de ${site.domaine} par jour du ${formaterJourMois(periode.du)} au ${formaterJourMois(periode.au)}`}
        />
        <figcaption>
          Visiteurs par jour · du {formaterJourMois(periode.du)} au {formaterJourMois(periode.au)}
        </figcaption>
      </figure>
      <div className="tdb-trafic__repartitions">
        <Repartition titre="D’où viennent les visiteurs" elements={enBarres(site.sources)} />
        <Repartition titre="Appareils" elements={enBarres(site.appareils)} />
        <Repartition titre="Pages les plus vues" code elements={enBarres(site.pages.slice(0, 8), 'chemin')} />
        {site.geo && <Repartition titre="Pays" elements={site.pays.slice(0, 6).map((p) => ({ cle: p.code || 'inconnu', libelle: p.code ? nomPays(p.code) : 'Pays inconnu', valeur: p.nombre }))} />}
        {site.campagnes.length > 0 && <Repartition titre="Campagnes" elements={enBarres(site.campagnes)} />}
        {site.passageStore && store.total > 0 && <Repartition titre="Clics vers les stores : d’où" elements={enBarres(store.origines)} />}
        {site.passageStore && store.total > 0 && <Repartition titre="Clics vers les stores : appareil" elements={enBarres(store.appareils)} />}
      </div>
      <p className="tdb-avis__meta">
        Lu dans les journaux du serveur : rien n’est ajouté au site, robots écartés, même comptage que l’outil marketing du projet · {compter(site.joursLus, 'journée lue', 'journées lues')} sur{' '}
        {periode.jours}
        {site.avertissement ? ` · dernière relecture incomplète (${site.avertissement})` : ''} · lu à {formaterHeure(verifieLe)}
      </p>
    </div>
  );
}
