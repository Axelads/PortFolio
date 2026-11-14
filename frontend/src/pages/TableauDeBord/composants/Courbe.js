import React, { useLayoutEffect, useRef, useState } from 'react';
import { formaterJourLong, formaterJourMois, formaterNombre } from '../outils';

// Géométrie du tracé (viewBox 0 0 100 40) : 4 unités d'air en haut, 2 en bas, pour que le trait ne soit jamais rogné.
const HAUT = 4;
const BAS = 38;

/**
 * Courbe d'une série par jour (téléchargements, visiteurs, pages vues…) : aire et trait, dévoilés une fois à
 * l'apparition, puis lisibles jour par jour. À la souris, au doigt ou au clavier (flèches, Début, Fin), un repère
 * vertical s'aligne sur le jour le plus proche et une bulle donne la valeur, la date et le détail de ce jour : on vise
 * une date, jamais un trait de 2 px. Les mêmes valeurs existent sans survol dans un tableau lu par les lecteurs d'écran.
 *
 * `points` : [{ jour: 'AAAA-MM-JJ', valeur, detail?, absent? }] dans l'ordre du temps ; `absent` = jour sans donnée
 * publiée (la courbe s'interrompt et la bulle le dit, au lieu d'un faux zéro). `unite` : ['visiteur', 'visiteurs'].
 * `compacte` (tuiles de la vue d'ensemble) : sans graduations, et la lecture du jour s'écrit sous le tracé au lieu
 * d'une bulle, pour ne rien masquer de la tuile.
 */
export default function Courbe({ points, unite = ['', ''], libelle, compacte = false }) {
  const [actif, setActif] = useState(null);
  const plan = useRef(null);
  const bulle = useRef(null);
  const n = points.length;
  const max = Math.max(1, ...points.map((p) => p.valeur));
  const x = (i) => (n > 1 ? (i / (n - 1)) * 100 : 50);
  const y = (v) => BAS - (v / max) * (BAS - HAUT);
  // Tracé par tronçons : un jour sans donnée publiée coupe la courbe au lieu de la faire tomber à zéro.
  const troncons = [];
  points.forEach((p, i) => {
    if (p.absent) return;
    const dernier = troncons.at(-1);
    if (dernier && dernier.at(-1) === i - 1) dernier.push(i);
    else troncons.push([i]);
  });
  const sommet = (i) => `${x(i).toFixed(2)},${y(points[i].valeur).toFixed(2)}`;
  const aire = troncons.map((t) => `M${x(t[0]).toFixed(2)},40 L${t.map(sommet).join(' L')} L${x(t.at(-1)).toFixed(2)},40 Z`).join(' ');
  const trait = troncons.filter((t) => t.length > 1).map((t) => `M${t.map(sommet).join(' L')}`).join(' ');
  const point = actif === null ? null : points[actif];

  // La bulle reste dans le graphique : centrée sur le repère, ramenée au bord quand elle dépasserait (une bulle qui
  // sort du panneau élargit la page sur téléphone). Mesurée après rendu, posée sans nouveau rendu.
  useLayoutEffect(() => {
    if (actif === null || !bulle.current || !plan.current) return;
    const largeur = plan.current.clientWidth;
    const centre = (x(actif) / 100) * largeur;
    bulle.current.style.left = `${Math.max(0, Math.min(largeur - bulle.current.offsetWidth, centre - bulle.current.offsetWidth / 2))}px`;
  });

  const viser = (e) => {
    const cadre = plan.current.getBoundingClientRect();
    if (!cadre.width) return;
    setActif(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - cadre.left) / cadre.width) * (n - 1)))));
  };
  const auClavier = (e) => {
    const cible = { ArrowLeft: (actif ?? n) - 1, ArrowRight: (actif ?? -1) + 1, Home: 0, End: n - 1 }[e.key];
    if (e.key === 'Escape') setActif(null);
    if (cible === undefined) return;
    e.preventDefault();
    setActif(Math.max(0, Math.min(n - 1, cible)));
  };

  if (!n) return null;
  const valeurDe = (p) => (p.absent ? 'Pas encore publié' : `${formaterNombre(p.valeur)}${unite[0] ? ` ${p.valeur > 1 ? unite[1] : unite[0]}` : ''}`);
  const milieu = points[Math.floor((n - 1) / 2)];

  return (
    <div className={`tdb-courbe${compacte ? ' tdb-courbe--compacte' : ''}`}>
      {/* La zone sensible déborde de 10 px de chaque côté du tracé : le premier et le dernier jour se visent sans peine. */}
      <div
        className="tdb-courbe__zone"
        role="group"
        aria-roledescription="graphique"
        aria-label={`${libelle}. Flèches gauche et droite pour lire chaque jour.`}
        tabIndex={0}
        onPointerMove={viser}
        onPointerDown={viser}
        // Au doigt, la bulle reste après le toucher, le temps de la lire ; à la souris, elle suit le pointeur.
        onPointerLeave={(e) => e.pointerType === 'mouse' && setActif(null)}
        onKeyDown={auClavier}
        onFocus={(e) => actif === null && e.target.matches(':focus-visible') && setActif(n - 1)}
        onBlur={() => setActif(null)}
      >
        <div ref={plan} className="tdb-courbe__plan">
          <svg className="tdb-courbe__trace" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
            <path className="tdb-courbe__aire" d={aire} />
            <path className="tdb-courbe__trait" d={trait} vectorEffect="non-scaling-stroke" />
          </svg>
          {!compacte && <span className="tdb-courbe__max" aria-hidden="true">{formaterNombre(max)}</span>}
          {point && (
            <>
              <i className="tdb-courbe__repere" style={{ left: `${x(actif)}%` }} aria-hidden="true" />
              {!point.absent && <i className="tdb-courbe__point" style={{ left: `${x(actif)}%`, top: `${(y(point.valeur) / 40) * 100}%` }} aria-hidden="true" />}
              {!compacte && (
                <span ref={bulle} className="tdb-courbe__bulle" aria-hidden="true">
                  <strong>{valeurDe(point)}</strong>
                  <span>
                    {formaterJourLong(point.jour)}
                    {point.detail ? ` · ${point.detail}` : ''}
                  </span>
                </span>
              )}
            </>
          )}
        </div>
      </div>
      {compacte && (
        <p className="tdb-courbe__lecture" aria-hidden="true">
          {point ? (
            <>
              <strong>{valeurDe(point)}</strong> · {formaterJourLong(point.jour)}
              {point.detail ? ` · ${point.detail}` : ''}
            </>
          ) : (
            `du ${formaterJourMois(points[0].jour)} au ${formaterJourMois(points[n - 1].jour)}`
          )}
        </p>
      )}
      {!compacte && n > 1 && (
        <div className="tdb-courbe__axe" aria-hidden="true">
          <span>{formaterJourMois(points[0].jour)}</span>
          {n > 4 && <span>{formaterJourMois(milieu.jour)}</span>}
          <span>{formaterJourMois(points[n - 1].jour)}</span>
        </div>
      )}
      <span className="tdb-visuellement-cache" role="status" aria-live="polite">
        {point ? `${formaterJourLong(point.jour)} : ${valeurDe(point)}${point.detail ? `, ${point.detail}` : ''}` : ''}
      </span>
      {/* Dans un bloc : un tableau « caché » seul garde la largeur de son contenu et élargirait la page sur téléphone. */}
      <div className="tdb-visuellement-cache">
        <table>
          <caption>{libelle}</caption>
          <thead>
            <tr>
              <th scope="col">Jour</th>
              <th scope="col">Valeur</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.jour}>
                <th scope="row">{formaterJourLong(p.jour)}</th>
                <td>
                  {valeurDe(p)}
                  {p.detail ? ` (${p.detail})` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
