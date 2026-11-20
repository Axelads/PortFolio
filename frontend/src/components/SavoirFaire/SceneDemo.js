import React, { useEffect, useRef, useState } from 'react';
import { mouvementReduit, webglDisponible } from './demos/commun';

// Une démo WebGL de la section Savoir-faire. Le moteur (et three.js avec lui) est un fichier à part, téléchargé
// seulement quand la scène approche de l'écran : l'accueil ne paie rien tant qu'on n'y descend pas.
// Avant le montage, et pour toujours sans WebGL, une capture de la démo tient la place.
const SceneDemo = ({ charger, options = {}, affiche, altAffiche, etiquette, className = '', surPret, children }) => {
  const hoteRef = useRef(null);
  const [etat, setEtat] = useState('attente'); // attente | pret | repli

  useEffect(() => {
    const hote = hoteRef.current;
    let controle = null;
    let quitte = false;

    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (!entree.isIntersecting) return;
        observateur.disconnect();
        if (!webglDisponible()) {
          setEtat('repli');
          return;
        }
        charger()
          .then((monter) => {
            if (quitte) return;
            controle = monter(hote, { ...options, reduit: mouvementReduit() });
            if (!controle) {
              setEtat('repli');
              return;
            }
            setEtat('pret');
            surPret?.(controle);
          })
          .catch(() => {
            if (!quitte) setEtat('repli');
          });
      },
      { rootMargin: '400px 0px' },
    );
    observateur.observe(hote);

    return () => {
      quitte = true;
      observateur.disconnect();
      controle?.detruire();
    };
    // Monté une fois : les options d'une démo ne changent pas en cours de route.
  }, []);

  const repli = etat === 'repli';
  return (
    <div className={`scene-demo ${className}`} data-etat={etat}>
      <img
        className="scene-demo__affiche"
        src={affiche}
        alt={repli ? altAffiche : ''}
        aria-hidden={repli ? undefined : 'true'}
        loading="lazy"
        decoding="async"
      />
      <div className="scene-demo__hote" ref={hoteRef} role={repli ? undefined : 'img'} aria-label={repli ? undefined : etiquette} />
      {children}
    </div>
  );
};

export default SceneDemo;
