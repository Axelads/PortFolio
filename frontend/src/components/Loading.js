import React, { useEffect, useState } from 'react';
import '../styles/Loading.scss';

const Loading = () => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Déclenche le fondu progressif 1 seconde avant la fin des 5 secondes
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, 3000); // Commence l'animation de fondu à 4 secondes

    return () => clearTimeout(timer);
  }, []);

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