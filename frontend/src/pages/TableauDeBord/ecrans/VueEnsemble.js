import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Audience, { lignesAudience } from '../composants/Audience';
import CarteProjet from '../composants/CarteProjet';
import Indicateur from '../composants/Indicateur';
import { LigneActivite, LigneAlerte, Onglets, Panneau, SourceNonBranchee, TitreRevele } from '../composants/elements';
import { alertesDuCoffre, echeancesDuCoffre } from '../echeances';
import { generiqueDejaJoue, marquerGeneriqueJoue } from '../mouvement';
import { alertesAppStore, alertesBuilds, alertesCi, alertesDomaines, alertesGooglePlay, alertesDisponibilite, alertesPocketbase, formaterNombre, filActivite, FILTRES, formaterIlYa, formaterDans, formaterEuros, formaterHeure, formaterJourMois, tailleCarte, trierProjets } from '../outils';

/** « Expo EAS — plan Starter (…) » → « Expo EAS ». */
const nomCourt = (libelle) => libelle.split(' — ')[0];

/** Vue d'ensemble (maquette « Vue d'ensemble / bureau » et « / mobile »). */
// Générique (Figma, « Générique d'ouverture / bureau ») : rangée r → trait à 950 + 120 × r ms, carte k de la rangée
// à + 100 + 50 × k ms. Au-delà de la 7e rangée (téléphone), le rythme est plafonné.
const debutRangee = (r) => 950 + Math.min(r, 6) * 120;

const VueEnsemble = ({ projets, couts, disponibilite, domaines, activite, builds, stores, sites, pocketbase, coffre, dernierProjet, onOuvrir, generique = false }) => {
  const [filtre, setFiltre] = useState('tous');
  // Joué une seule fois : les retours sur la vue d'ensemble prennent la version courte.
  const [joue] = useState(() => generique && !generiqueDejaJoue());
  useEffect(() => {
    if (joue) marquerGeneriqueJoue();
  }, [joue]);
  const grille = useRef(null);
  const [traits, setTraits] = useState([]);
  // Avant le premier affichage : délai de chaque carte selon sa rangée et sa place, et un trait par rangée.
  useLayoutEffect(() => {
    if (!joue || !grille.current) return;
    const cartes = [...grille.current.querySelectorAll(':scope > .tdb-carte')];
    const hauts = [...new Set(cartes.map((c) => c.offsetTop))].sort((a, b) => a - b);
    for (const haut of hauts) {
      const r = hauts.indexOf(haut);
      cartes
        .filter((c) => c.offsetTop === haut)
        .sort((a, b) => a.offsetLeft - b.offsetLeft)
        .forEach((c, k) => c.style.setProperty('--tdb-delai', `${debutRangee(r) + 100 + k * 50}ms`));
    }
    setTraits(hauts.slice(0, 8).map((haut, r) => ({ haut: haut - 9, delai: debutRangee(r) })));
  }, [joue]);
  const tries = useMemo(() => trierProjets(projets), [projets]);
  const visibles = tries.filter(FILTRES.find((f) => f.cle === filtre).garde);
  const compte = (statut) => projets.filter((p) => p.statut === statut).length;
  const coutMensuel = (slug) => (couts?.lignes || []).filter((l) => l.projet === slug).reduce((s, l) => s + (l.mensuelEuros || 0), 0);
  const prochaine = couts?.echeances?.[0];
  const resultats = disponibilite && disponibilite !== 'erreur' ? disponibilite.resultats : null;
  const sondes = resultats ? Object.values(resultats).filter((r) => r.etat !== 'inconnu') : [];
  const enLigne = sondes.filter((r) => r.etat === 'en-ligne' || r.etat === 'lent').length;
  const enDifficulte = sondes.length - enLigne;
  const lents = sondes.filter((r) => r.etat === 'lent').length;
  const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;
  const documentsDuCoffre = coffre && coffre !== 'erreur' ? coffre.documents : [];
  const alertes = [
    ...alertesDisponibilite(projets, resultats ? disponibilite : null),
    // Coffre de documents : contrats à renouveler ou proches de leur terme, dates clés de la semaine.
    ...alertesDuCoffre(documentsDuCoffre, projets),
    ...alertesDomaines(projets, domaines && domaines !== 'erreur' ? domaines : null),
    ...alertesCi(projets, activite && activite !== 'erreur' ? activite : null),
    ...alertesBuilds(projets, builds && builds !== 'erreur' ? builds : null),
    ...alertesAppStore(projets, stores && stores !== 'erreur' ? stores : null),
    ...alertesGooglePlay(projets, stores && stores !== 'erreur' ? stores : null),
    ...alertesPocketbase(projets, pocketbase && pocketbase !== 'erreur' ? pocketbase : null),
    ...(couts?.alertes || []).map((a) => ({ ...a, temps: a.date ? formaterJourMois(a.date) : null })),
  ];
  // Prochaines échéances : les coûts à payer et les dates des documents (fins de période, dates clés), mêlés par date.
  const echeances = [
    ...(couts?.echeances || []).map((e) => ({
      cle: `cout-${e.id}`,
      icone: 'euro',
      jours: e.dansJours,
      date: e.date,
      texte: nomCourt(e.libelle),
      detail: `${e.montantEuros != null ? formaterEuros(e.montantEuros, { centimes: true }) : 'Montant variable'}${e.converti ? ' · converti' : ''}`,
    })),
    ...echeancesDuCoffre(documentsDuCoffre, projets).map((e) => ({ ...e, icone: 'calendrier' })),
  ].sort((a, b) => a.jours - b.jours);
  const panneEnProduction = projets.some((p) => p.statut === 'production' && resultats?.[p.slug]?.etat === 'panne');
  const ios = stores && stores !== 'erreur' ? stores.ios : null;
  const iosLu = ios?.branche && !ios.erreur;
  const android = stores && stores !== 'erreur' ? stores.android : null;
  const androidCumul = android?.branche && !android.erreur && android.total?.cumul != null ? android.total.cumul : null;
  let contexteAndroid = '';
  if (android?.rapports === 'en-attente') contexteAndroid = ' · Google Play : accès aux rapports en cours d’ouverture';
  else if (androidCumul != null) contexteAndroid = ` · Google Play : ${androidCumul} installations`;
  const fil = filActivite(activite && activite !== 'erreur' ? activite : null, builds && builds !== 'erreur' ? builds : null);
  const aucuneSource = activite?.branche === false && builds?.branche === false;
  const lectureEnCours = (activite === null || builds === null) && fil.length === 0;
  let contexteDispo = 'Sites et PocketBase des projets';
  if (resultats) contexteDispo = enDifficulte ? `${enDifficulte} en difficulté` : 'Tout répond';
  if (resultats && lents) contexteDispo += ` · ${pluriel(lents, 'lent')}`;
  const tauxSecours = couts?.taux?.source === 'secours';
  // Visiteurs : mesure maison des sites, lue dans leur PocketBase (pas Google Analytics).
  // S'y ajoutent les sites suivis par les journaux de leur hébergeur (lunello.family), sans rien dans leurs pages.
  const pb = pocketbase && pocketbase !== 'erreur' && pocketbase.branche ? pocketbase : null;
  const journaux = sites && sites !== 'erreur' && sites.branche ? sites : null;
  const frequentation = projets
    .map((p) => {
      const trafic = pb?.projets[p.slug]?.trafic;
      if (trafic) return { nom: p.nom, visiteurs: trafic.total.visiteurs, vues: trafic.total.vues };
      const j = journaux?.projets[p.slug];
      return j?.joursLus ? { nom: p.nom, visiteurs: j.total.visiteurs, vues: j.total.pagesVues } : null;
    })
    .filter(Boolean);
  const visiteurs = frequentation.reduce((s, f) => s + f.visiteurs, 0);
  const illisibles = [
    ...(pb ? projets.filter((p) => pb.projets[p.slug]?.erreur).map((p) => ({ nom: p.nom, erreur: pb.projets[p.slug].erreur })) : []),
    ...(journaux ? projets.filter((p) => journaux.projets[p.slug]?.erreur).map((p) => ({ nom: p.nom, erreur: journaux.projets[p.slug].erreur })) : []),
  ];
  let fraicheurVisiteurs = 'Lecture des PocketBase…';
  if (pocketbase === 'erreur') fraicheurVisiteurs = 'Lecture impossible';
  else if (pb) fraicheurVisiteurs = `PocketBase et journaux des sites · lu à ${formaterHeure(pb.verifieLe)}`;
  // Audience comparée des projets (sites et apps), relue quand une source arrive.
  const audience = useMemo(
    () => lignesAudience(projets, { pocketbase: pb, sites: journaux, ios: iosLu ? ios : null, android: android?.branche && !android.erreur ? android : null }),
    [projets, pb, journaux, ios, iosLu, android],
  );
  const sourcesAudienceEnCours = pocketbase === null || stores === null || sites === null;
  /** Depuis une ligne d'audience : même transition que la carte du projet quand elle est à l'écran. */
  const ouvrirDepuisAudience = (projet) => {
    const carte = grille.current?.querySelector(`.tdb-carte[data-slug="${projet.slug}"]`);
    if (carte) return onOuvrir(projet, carte);
    setFiltre('tous');
    return requestAnimationFrame(() => {
      const visible = grille.current?.querySelector(`.tdb-carte[data-slug="${projet.slug}"]`);
      if (visible) onOuvrir(projet, visible);
    });
  };

  return (
    <div className={`tdb-ecran tdb-vue${joue ? ' tdb-vue--generique' : ''}`}>
      <div className="tdb-titre">
        <TitreRevele texte="Vue d’ensemble" className="tdb-titre__texte" />
        <p className="tdb-titre__sous">
          {projets.length} projets · {compte('production')} en production · {compte('developpement')} en développement
        </p>
      </div>

      <div className="tdb-indicateurs">
        <Indicateur
          i={0}
          delai={joue ? 980 : 0}
          icone="activite"
          libelle="Services en ligne"
          valeur={resultats ? enLigne : null}
          formater={(v) => `${Math.round(v)} / ${sondes.length}`}
          contexte={contexteDispo}
          fraicheur={disponibilite === 'erreur' ? 'Vérification impossible' : resultats ? `Vérifié à ${formaterHeure(disponibilite.verifieLe)}` : 'Vérification en cours…'}
          etatFraicheur={!resultats ? 'inconnu' : panneEnProduction ? 'panne' : enDifficulte ? 'alerte' : 'en-ligne'}
        />
        <Indicateur
          i={1}
          delai={joue ? 1050 : 0}
          icone="euro"
          libelle="Coûts du mois"
          valeur={couts?.totalMensuel ?? null}
          formater={(v) => formaterEuros(v)}
          unite="par mois"
          contexte={couts ? `${formaterEuros(couts.cumul)} payés depuis le début` : 'Coûts indisponibles'}
          fraicheur={couts ? `Factures · taux ${tauxSecours ? 'de secours' : 'BCE'} du ${formaterJourMois(couts.taux.date)}` : '—'}
          etatFraicheur={tauxSecours ? 'alerte' : 'en-ligne'}
        />
        <Indicateur
          i={2}
          delai={joue ? 1120 : 0}
          icone="cloche"
          libelle="Prochaine échéance"
          valeur={prochaine ? (prochaine.dansJours === 0 ? 'Aujourd’hui' : prochaine.dansJours) : null}
          formater={(v) => String(Math.round(v))}
          unite={prochaine && prochaine.dansJours > 0 ? (prochaine.dansJours > 1 ? 'jours' : 'jour') : undefined}
          contexte={prochaine ? `${nomCourt(prochaine.libelle)} · ${formaterEuros(prochaine.montantEuros, { centimes: true })}` : 'Aucune dans les 60 jours'}
          fraicheur={couts ? `${couts.echeances.length} dans les 60 jours` : '—'}
        />
        <Indicateur
          i={3}
          delai={joue ? 1190 : 0}
          icone="telechargement"
          libelle="Téléchargements"
          nonBranche={ios?.branche === false}
          valeur={iosLu ? ios.depuisLancement.telechargements : null}
          unite="depuis le lancement"
          contexte={iosLu ? `App Store : ${ios.total.telechargements} sur 30 jours, ${ios.hier.telechargements} hier${contexteAndroid}` : ios?.erreur || 'App Store et Google Play'}
          fraicheur={iosLu ? 'App Store · données de la veille' : stores === 'erreur' ? 'Lecture impossible' : 'Lecture de l’App Store…'}
          etatFraicheur={iosLu ? 'en-ligne' : 'inconnu'}
        />
        <Indicateur
          i={4}
          delai={joue ? 1260 : 0}
          icone="utilisateurs"
          libelle="Visiteurs"
          nonBranche={pocketbase?.branche === false}
          valeur={frequentation.length ? visiteurs : null}
          unite="sur 30 jours"
          contexte={
            frequentation.length
              ? frequentation.map((f) => `${f.nom} : ${formaterNombre(f.vues)} pages vues`).join(' · ')
              : illisibles.length
                ? `${illisibles[0].nom} : ${illisibles[0].erreur}`
                : 'Mesure maison des sites, dans leur PocketBase'
          }
          fraicheur={fraicheurVisiteurs}
          etatFraicheur={frequentation.length ? (illisibles.length ? 'alerte' : 'en-ligne') : 'inconnu'}
        />
      </div>

      <div className="tdb-vue__corps">
        <div className="tdb-vue__principal">
          <section className="tdb-bento" aria-label="Projets">
            <Onglets
              libelle="Filtrer les projets"
              className="tdb-bento__filtres"
              elements={FILTRES.map((f) => ({ cle: f.cle, libelle: `${f.libelle} · ${projets.filter(f.garde).length}` }))}
              actif={filtre}
              onChoisir={setFiltre}
            />
            <div className="tdb-bento__grille" ref={grille}>
              {traits.map((t) => (
                <span key={t.haut} className="tdb-trait-rangee" style={{ top: t.haut, '--tdb-delai': `${t.delai}ms` }} aria-hidden="true" />
              ))}
              {visibles.map((p, rang) => (
                <CarteProjet
                  key={p.slug}
                  projet={p}
                  taille={tailleCarte(p, tries.indexOf(p))}
                  coutMensuel={coutMensuel(p.slug)}
                  sante={resultats?.[p.slug]}
                  i={Math.min(rang, 14)}
                  nommer={dernierProjet === p.slug}
                  onOuvrir={onOuvrir}
                />
              ))}
            </div>
          </section>

          <Panneau titre="Audience" compteur={audience.length || undefined} id="tdb-audience" className="tdb-vue__audience">
            {audience.length > 0 && (
              <>
                <p className="tdb-vue__audience-aide">Visiteurs des sites et téléchargements des apps, jour par jour. Passe sur une courbe pour lire un jour.</p>
                <Audience lignes={audience} onOuvrir={ouvrirDepuisAudience} />
              </>
            )}
            {!audience.length && sourcesAudienceEnCours && <p className="tdb-vide">Lecture des sites et des stores…</p>}
            {!audience.length && !sourcesAudienceEnCours && <p className="tdb-vide">Aucune audience mesurée pour l’instant.</p>}
          </Panneau>
        </div>

        <aside className="tdb-colonne" aria-label="Alertes et échéances">
          <Panneau titre="Alertes" compteur={alertes.length} id="tdb-alertes" i={0}>
            {alertes.length ? (
              <ul className="tdb-liste">
                {alertes.map((a) => (
                  <LigneAlerte key={a.titre} gravite={a.gravite} titre={a.titre} detail={a.detail} temps={a.temps} nouvelle={a.nouvelle} />
                ))}
              </ul>
            ) : (
              <p className="tdb-vide">Rien à signaler.</p>
            )}
          </Panneau>
          <Panneau titre="Prochaines échéances" i={1}>
            {echeances.length ? (
              <ul className="tdb-liste">
                {echeances.map((e) => (
                  <LigneActivite key={e.cle} icone={e.icone} texte={e.texte} detail={e.detail} temps={`${formaterJourMois(e.date)} · ${formaterDans(e.jours)}`} />
                ))}
              </ul>
            ) : (
              <p className="tdb-vide">Aucune échéance dans les 60 jours.</p>
            )}
          </Panneau>
          <Panneau titre="Activité" i={2}>
            {fil.length > 0 && (
              <ul className="tdb-liste">
                {fil.map((e) => (
                  <LigneActivite key={e.cle} icone={e.icone} etat={e.etat} texte={e.texte} lien={e.lien} detail={e.detail} temps={formaterIlYa(e.date)} />
                ))}
              </ul>
            )}
            {lectureEnCours && <p className="tdb-vide">Lecture de GitHub et d’Expo…</p>}
            {(activite === 'erreur' || builds === 'erreur') && <p className="tdb-vide tdb-vide--erreur">{activite === 'erreur' ? 'GitHub' : 'Expo'} momentanément illisible.</p>}
            {aucuneSource && <SourceNonBranchee compact>Commits, builds et mises à jour OTA s’afficheront ici quand les clés GitHub et Expo seront installées sur le serveur.</SourceNonBranchee>}
          </Panneau>
        </aside>
      </div>
    </div>
  );
};

export default VueEnsemble;
