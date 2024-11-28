import React, { useEffect, useState, useContext } from 'react';
import { LoadingContext } from '../contexts/LoadingContext';
import '../styles/Loading.scss';

const Loading = () => {
  const [fadeOut, setFadeOut] = useState(false);
  const { isFirstLoad, setIsFirstLoad } = useContext(LoadingContext);

  useEffect(() => {
    if (isFirstLoad) {
      // Déclenche le fondu progressif 1 seconde avant la fin des 5 secondes
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setIsFirstLoad(false); // Désactive le chargement globalement après la première utilisation
        }, 1000); // Attendre que l'animation de fondu se termine
      }, 3000); // Commence l'animation de fondu à 4 secondes

      return () => clearTimeout(timer);
    }
  }, [isFirstLoad, setIsFirstLoad]);

  if (!isFirstLoad) {
    // Si ce n'est plus le premier chargement, ne pas afficher le composant
    return null;
  }

  return (
    <div className={`loading-container ${fadeOut ? 'fade-out' : ''}`}>
      <div className="loader">
        <p className="loading-text">Developper Web is coming</p>
      </div>
      <div className="orbit orbit-1"></div>
      <div className="orbit orbit-2"></div>
      <div className="orbit orbit-3"></div>
    </div>
  );
};

export default Loading;
