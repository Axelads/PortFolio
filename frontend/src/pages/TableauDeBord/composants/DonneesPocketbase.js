import React, { useDeferredValue, useMemo, useState } from 'react';
import Courbe from './Courbe';
import { Badge, Bouton } from './elements';
import { formaterDateCourte, formaterDateHeure, formaterHeure, formaterIlYa, formaterJourMois, formaterNombre, formaterTelephone, joursContinus, LIBELLES_APPAREIL, LIBELLES_CANAL, ROLES_MEMBRE, sansAccents } from '../outils';

// Données lues dans le PocketBase d'un projet par son module « tableau de bord » (GET /pocketbase/…) :
// trafic du site (mesure maison, sans cookie), utilisation d'une app et liste détaillée des membres.
// Les libellés de l'utilisation et les étiquettes des membres viennent du module du projet : l'interface ne
// connaît aucun projet en particulier.

/** Répartition en barres : pages, sources, appareils. Barres dessinées une fois, en cascade. */
export const Repartition = ({ titre, elements, code = false }) => {
  const max = Math.max(1, ...elements.map((e) => e.valeur));
  return (
    <section className="tdb-repartition">
      <h3 className="tdb-repartition__titre">{titre}</h3>
      {elements.length ? (
        <ol className="tdb-repartition__liste">
          {elements.map((e, i) => (
            <li key={e.cle} className="tdb-repartition__ligne" style={{ '--part': e.valeur / max, '--i': i }}>
              <span className={`tdb-repartition__libelle${code ? ' tdb-repartition__libelle--code' : ''}`} title={e.libelle}>
                {e.libelle}
              </span>
              <span className="tdb-repartition__valeur">{formaterNombre(e.valeur)}</span>
              <span className="tdb-repartition__barre" aria-hidden="true" />
            </li>
          ))}
        </ol>
      ) : (
        <p className="tdb-vide">Rien sur la période.</p>
      )}
    </section>
  );
};

/** Trafic d'un site sur 30 jours : pages vues, visiteurs, courbe, pages, sources et appareils. */
export const TraficSite = ({ trafic, verifieLe }) => {
  const jours = joursContinus(trafic.jours);
  if (!jours.length) return <p className="tdb-vide">Aucune page vue ces 30 derniers jours.</p>;
  const dernier = jours.at(-1);
  const moyenne = Math.round(trafic.total.vues / jours.length);
  return (
    <div className="tdb-trafic">
      <div className="tdb-chiffres">
        {[
          ['Pages vues · 30 j', trafic.total.vues, `${formaterNombre(moyenne)} par jour en moyenne`],
          ['Visiteurs · 30 j', trafic.total.visiteurs, 'uniques chaque jour, additionnés'],
          ['Dernier jour', dernier.vues, `pages vues le ${formaterJourMois(dernier.jour)} · ${dernier.visiteurs} visiteur${dernier.visiteurs > 1 ? 's' : ''}`],
        ].map(([libelle, valeur, contexte]) => (
          <div key={libelle} className="tdb-chiffres__bloc">
            <p className="tdb-chiffres__libelle">{libelle}</p>
            <p className="tdb-chiffres__valeur">{formaterNombre(valeur)}</p>
            <p className="tdb-chiffres__contexte">{contexte}</p>
          </div>
        ))}
      </div>
      {jours.length > 1 && (
        <figure className="tdb-ios__courbe">
          <Courbe
            points={jours.map((j) => ({ jour: j.jour, valeur: j.vues, detail: `${formaterNombre(j.visiteurs)} visiteur${j.visiteurs > 1 ? 's' : ''}` }))}
            unite={['page vue', 'pages vues']}
            libelle={`Pages vues par jour du ${formaterJourMois(jours[0].jour)} au ${formaterJourMois(dernier.jour)}`}
          />
          <figcaption>
            Pages vues par jour · du {formaterJourMois(jours[0].jour)} au {formaterJourMois(dernier.jour)}
          </figcaption>
        </figure>
      )}
      <div className="tdb-trafic__repartitions">
        <Repartition titre="Pages les plus vues" code elements={trafic.pages.map((p) => ({ cle: p.chemin, libelle: p.chemin, valeur: p.vues }))} />
        <Repartition titre="Sources" elements={trafic.sources.map((s) => ({ cle: s.canal, libelle: LIBELLES_CANAL[s.canal] || s.canal, valeur: s.vues }))} />
        <Repartition titre="Appareils" elements={trafic.appareils.map((a) => ({ cle: a.appareil || 'inconnu', libelle: LIBELLES_APPAREIL[a.appareil] || a.appareil || 'Inconnu', valeur: a.vues }))} />
      </div>
      <p className="tdb-avis__meta">{trafic.note || 'Mesure maison du site, sans cookie · visites de l’équipe exclues'} · lu à {formaterHeure(verifieLe)}</p>
    </div>
  );
};

/** Utilisation d'une app (forme commune des modules) : chiffres, courbe sur 30 jours et répartitions déjà libellés. */
export const UsageProjet = ({ usage, verifieLe }) => {
  const jours = usage.courbe ? joursContinus(usage.courbe.jours, { fenetre: 30 }) : [];
  return (
    <div className="tdb-trafic">
      {usage.chiffres?.length > 0 && (
        <div className="tdb-chiffres">
          {usage.chiffres.map((c) => (
            <div key={c.libelle} className="tdb-chiffres__bloc">
              <p className="tdb-chiffres__libelle">{c.libelle}</p>
              <p className="tdb-chiffres__valeur">{c.affichage ?? formaterNombre(c.valeur)}</p>
              {c.contexte && <p className="tdb-chiffres__contexte">{c.contexte}</p>}
            </div>
          ))}
        </div>
      )}
      {jours.length > 1 && (
        <figure className="tdb-ios__courbe">
          <Courbe points={jours.map((j) => ({ jour: j.jour, valeur: j.valeur }))} libelle={`${usage.courbe.libelle} du ${formaterJourMois(jours[0].jour)} au ${formaterJourMois(jours.at(-1).jour)}`} />
          <figcaption>
            {usage.courbe.libelle} · du {formaterJourMois(jours[0].jour)} au {formaterJourMois(jours.at(-1).jour)} · {formaterNombre(jours.reduce((t, j) => t + j.valeur, 0))} en tout
          </figcaption>
        </figure>
      )}
      {usage.repartitions?.length > 0 && (
        <div className="tdb-trafic__repartitions">
          {usage.repartitions.map((rep) => (
            <Repartition key={rep.titre} titre={rep.titre} elements={rep.elements.map((e) => ({ cle: e.libelle, libelle: e.libelle, valeur: e.valeur }))} />
          ))}
        </div>
      )}
      <p className="tdb-avis__meta">Lu dans le PocketBase du projet · lu à {formaterHeure(verifieLe)}</p>
    </div>
  );
};

const PAR_PAGE = 50;
const TON_ROLE = { admin: 'accent', moderateur: 'en-ligne' };
const nomComplet = (m) => [m.prenom, m.nom].filter(Boolean).join(' ') || m.pseudo || m.email;
const horodatage = (v) => (v ? Date.parse(String(v).replace(' ', 'T')) : -Infinity);
// Comparaisons croissantes ; le sens choisi les inverse. Sans dernière connexion : en fin de liste (tri décroissant).
const TRIS = {
  connexion: (a, b) => horodatage(a.derniereConnexion) - horodatage(b.derniereConnexion) || horodatage(a.inscription) - horodatage(b.inscription),
  inscription: (a, b) => horodatage(a.inscription) - horodatage(b.inscription),
  nom: (a, b) => nomComplet(a).localeCompare(nomComplet(b), 'fr', { sensitivity: 'base' }),
};
// Cinq colonnes au plus : le tableau tient dans la colonne de gauche de la fiche (rôle et étiquettes sous le nom).
// « Ville » n'apparaît que si le projet la connaît.
const COLONNES = [
  { cle: 'nom', libelle: 'Membre', tri: 'nom' },
  { cle: 'contact', libelle: 'Contact' },
  { cle: 'ville', libelle: 'Ville', facultative: true },
  { cle: 'inscription', libelle: 'Inscription', tri: 'inscription' },
  { cle: 'connexion', libelle: 'Dernière connexion', tri: 'connexion' },
];

/** Totaux des membres (résumé, sans donnée personnelle). */
export const TotauxMembres = ({ membres }) => (
  <div className="tdb-chiffres">
    {[
      [membres.libelle || 'Membres', membres.total, 'comptes créés'],
      ['Nouveaux · 7 j', membres.nouveaux7j, `${membres.nouveaux30j} sur 30 jours`],
      ['Actifs · 30 j', membres.actifs30j, 'au moins une connexion ou activité'],
    ].map(([libelle, valeur, contexte]) => (
      <div key={libelle} className="tdb-chiffres__bloc">
        <p className="tdb-chiffres__libelle">{libelle}</p>
        <p className="tdb-chiffres__valeur">{formaterNombre(valeur)}</p>
        <p className="tdb-chiffres__contexte">{contexte}</p>
      </div>
    ))}
  </div>
);

const NOTE_CONNEXION = 'Dernière connexion : notée à chaque connexion réussie depuis la mise en place du suivi, au plus une fois toutes les 10 minutes.';

/**
 * Liste détaillée des membres, en clair (choix du 11/10) : recherche, tri par colonne, 50 par 50.
 * `libelles.derniereConnexion` et `note` viennent du module quand le projet mesure autre chose qu'une connexion.
 */
export const ListeMembres = ({ liste, libelles = {}, note = NOTE_CONNEXION }) => {
  const libelleConnexion = libelles.derniereConnexion || 'Dernière connexion';
  const [recherche, setRecherche] = useState('');
  const [tri, setTri] = useState({ cle: 'connexion', sens: -1 });
  const [nombre, setNombre] = useState(PAR_PAGE);
  const differee = useDeferredValue(recherche);
  const avecVille = liste.some((m) => m.ville);
  const avecTelephone = liste.some((m) => 'telephone' in m);
  const indice = `${['Nom', 'e-mail', avecTelephone && 'téléphone', avecVille && 'ville', liste.some((m) => m.etiquettes?.length) && 'étiquette'].filter(Boolean).join(', ')}…`;
  const colonnes = COLONNES.filter((c) => !c.facultative || avecVille).map((c) => (c.cle === 'connexion' ? { ...c, libelle: libelleConnexion } : c));

  const filtres = useMemo(() => {
    const termes = sansAccents(differee).split(/\s+/).filter(Boolean);
    const garde = termes.length
      ? liste.filter((m) => {
          const texte = sansAccents([m.prenom, m.nom, m.pseudo, m.email, m.ville, m.telephone, m.telephone?.replace(/\D/g, ''), ROLES_MEMBRE[m.role], ...(m.etiquettes || []).map((e) => e.texte)].join(' '));
          return termes.every((t) => texte.includes(t));
        })
      : liste;
    return [...garde].sort((a, b) => tri.sens * TRIS[tri.cle](a, b));
  }, [liste, differee, tri]);
  const visibles = filtres.slice(0, nombre);
  const reste = filtres.length - visibles.length;

  // Premier clic : A → Z pour le nom, plus récent d'abord pour les dates ; clic suivant : sens inverse.
  const trier = (cle) => setTri((t) => ({ cle, sens: t.cle === cle ? -t.sens : cle === 'nom' ? 1 : -1 }));

  return (
    <div className="tdb-membres">
      <div className="tdb-membres__outils">
        <label className="tdb-champ tdb-membres__recherche">
          <span className="tdb-visuellement-cache">Rechercher un membre</span>
          <input
            className="tdb-champ__saisie"
            type="search"
            placeholder={indice}
            autoComplete="off"
            spellCheck={false}
            value={recherche}
            onChange={(e) => {
              setRecherche(e.target.value);
              setNombre(PAR_PAGE);
            }}
          />
        </label>
        <p className="tdb-membres__compte" role="status">
          {filtres.length === liste.length ? `${formaterNombre(liste.length)} membre${liste.length > 1 ? 's' : ''}` : `${formaterNombre(filtres.length)} sur ${formaterNombre(liste.length)}`}
        </p>
      </div>

      {filtres.length ? (
        <div className="tdb-membres__defilement">
          <table className="tdb-membres__table">
            <thead>
              <tr>
                {colonnes.map((c) => (
                  <th key={c.cle} scope="col" aria-sort={c.tri && tri.cle === c.tri ? (tri.sens === 1 ? 'ascending' : 'descending') : undefined}>
                    {c.tri ? (
                      <button type="button" className={`tdb-membres__tri${tri.cle === c.tri ? ' tdb-membres__tri--actif' : ''}`} onClick={() => trier(c.tri)}>
                        {c.libelle}
                        <span className="tdb-membres__sens" aria-hidden="true">
                          {tri.cle === c.tri && tri.sens === 1 ? '↑' : '↓'}
                        </span>
                      </button>
                    ) : (
                      c.libelle
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibles.map((m) => (
                <tr key={m.id}>
                  <th scope="row" className="tdb-membres__membre">
                    <span className="tdb-membres__nom">{nomComplet(m)}</span>
                    {m.pseudo && nomComplet(m) !== m.pseudo && <span className="tdb-membres__pseudo">@{m.pseudo}</span>}
                    {(TON_ROLE[m.role] || m.banni || m.verifie === false || m.newsletter || m.etiquettes?.length > 0) && (
                      <span className="tdb-membres__badges">
                        {TON_ROLE[m.role] && <Badge ton={TON_ROLE[m.role]}>{ROLES_MEMBRE[m.role]}</Badge>}
                        {m.banni && <Badge ton="panne">Banni</Badge>}
                        {m.verifie === false && <Badge ton="alerte">E-mail non vérifié</Badge>}
                        {m.newsletter && <Badge>Newsletter</Badge>}
                        {/* Une étiquette répétée par le module (même rôle dans deux établissements) ne s'affiche qu'une fois. */}
                        {m.etiquettes?.filter((e, i, liste) => liste.findIndex((x) => x.texte === e.texte) === i).map((e) => (
                          <Badge key={e.texte} ton={e.ton}>
                            {e.texte}
                          </Badge>
                        ))}
                      </span>
                    )}
                  </th>
                  <td data-libelle="Contact">
                    <span className="tdb-membres__contact">
                      <a className="tdb-membres__lien" href={`mailto:${m.email}`}>
                        {m.email}
                      </a>
                      {m.telephone && (
                        <a className="tdb-membres__lien" href={`tel:${m.telephone.replace(/[^\d+]/g, '')}`}>
                          {formaterTelephone(m.telephone)}
                        </a>
                      )}
                      {avecTelephone && !m.telephone && <span className="tdb-membres__absent">pas de téléphone</span>}
                    </span>
                  </td>
                  {avecVille && <td data-libelle="Ville">{m.ville || <span className="tdb-membres__absent">—</span>}</td>}
                  <td data-libelle="Inscription">
                    <time dateTime={String(m.inscription).replace(' ', 'T')} title={formaterDateHeure(m.inscription)}>
                      {formaterDateCourte(m.inscription)}
                    </time>
                  </td>
                  <td data-libelle={libelleConnexion}>
                    {m.derniereConnexion ? (
                      <time dateTime={String(m.derniereConnexion).replace(' ', 'T')} title={formaterDateHeure(m.derniereConnexion)}>
                        {formaterIlYa(m.derniereConnexion)}
                      </time>
                    ) : (
                      <span className="tdb-membres__absent">pas encore notée</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="tdb-vide">Aucun membre ne correspond à « {recherche} ».</p>
      )}

      {reste > 0 && (
        <Bouton variante="secondaire" className="tdb-membres__plus" onClick={() => setNombre((n) => n + PAR_PAGE)}>
          Afficher {Math.min(PAR_PAGE, reste)} de plus
        </Bouton>
      )}
      <p className="tdb-avis__meta">{note}</p>
    </div>
  );
};
