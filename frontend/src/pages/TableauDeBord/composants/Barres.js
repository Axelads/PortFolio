import React from 'react';
import { formaterNombre } from '../outils';

export const pourcent = (part, total) => `${total ? Math.round((part / total) * 100) : 0} %`;

/** Répartition en barres (mêmes classes que les modules : cascade dessinée une fois). */
const Barres = ({ titre, elements, total, code = false, vide = 'Rien sur la période.' }) => {
  const max = Math.max(1, ...elements.map((e) => e.valeur));
  return (
    <section className="tdb-repartition">
      <h3 className="tdb-repartition__titre">{titre}</h3>
      {elements.length ? (
        <ol className="tdb-repartition__liste">
          {elements.map((e, i) => (
            <li key={e.cle} className="tdb-repartition__ligne" style={{ '--part': e.valeur / max, '--i': i }}>
              <span className={`tdb-repartition__libelle${code ? ' tdb-repartition__libelle--code' : ''}`} title={e.titre || e.libelle}>
                {e.libelle}
              </span>
              <span className="tdb-repartition__valeur">
                {formaterNombre(e.valeur)}
                {total ? <span className="tdb-freq__part"> · {pourcent(e.valeur, total)}</span> : null}
              </span>
              {e.detail && <span className="tdb-freq__detail">{e.detail}</span>}
              <span className="tdb-repartition__barre" aria-hidden="true" />
            </li>
          ))}
        </ol>
      ) : (
        <p className="tdb-vide">{vide}</p>
      )}
    </section>
  );
};

export default Barres;
