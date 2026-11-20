import React from 'react';
import ETUDES from '../../assets/Data/DataEtudes.json';

// Étude de cas en tête d'une page projet : le besoin, mes choix, la livraison, le résultat (assets/Data/DataEtudes.json).
// Rien pour les projets qui n'en ont pas.
const PARTIES = [
  { cle: 'besoin', titre: 'Le besoin' },
  { cle: 'choix', titre: 'Mes choix' },
  { cle: 'livraison', titre: 'La livraison' },
];

const EtudeDeCas = ({ slug }) => {
  const etude = ETUDES[slug];
  if (!etude) return null;
  return (
    <section className="etude-de-cas" aria-labelledby="etude-de-cas-titre">
      <h2 id="etude-de-cas-titre">L'étude de cas</h2>
      <div className="etude-de-cas__grille">
        {PARTIES.map(({ cle, titre }) => (
          <div className="etude-de-cas__partie" key={cle}>
            <h3>{titre}</h3>
            <p>{etude[cle]}</p>
          </div>
        ))}
        <div className="etude-de-cas__partie etude-de-cas__partie--resultat">
          <h3>Le résultat</h3>
          <p>{etude.resultat}</p>
        </div>
      </div>
    </section>
  );
};

export default EtudeDeCas;
