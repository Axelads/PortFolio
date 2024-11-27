import React, { useState, useEffect } from 'react';
import dataComments from '../../assets/Data/DataComments.json'; // Chemin vers le fichier JSON

const CarouselComments = () => {
  const [active, setActive] = useState(0);

  // Effet visuel appliqué aux cartes
  useEffect(() => {
    const loadShow = () => {
      const items = document.querySelectorAll('.carousel .item');
      if (items.length === 0 || !items[active]) return;

      let stt = 0;

      items[active].style.transform = 'none';
      items[active].style.zIndex = 1;
      items[active].style.filter = 'none';
      items[active].style.opacity = 1;

      for (let i = active + 1; i < items.length; i++) {
        stt++;
        items[i].style.transform = `translateX(${120 * stt}px) scale(${1 - 0.2 * stt}) perspective(16px) rotateY(-1deg)`;
        items[i].style.zIndex = -stt;
        items[i].style.filter = 'blur(5px)';
        items[i].style.opacity = stt > 2 ? 0 : 0.6;
      }

      stt = 0;
      for (let i = active - 1; i >= 0; i--) {
        stt++;
        items[i].style.transform = `translateX(${-120 * stt}px) scale(${1 - 0.2 * stt}) perspective(16px) rotateY(1deg)`;
        items[i].style.zIndex = -stt;
        items[i].style.filter = 'blur(5px)';
        items[i].style.opacity = stt > 2 ? 0 : 0.6;
      }
    };

    loadShow();
  }, [active]);

  // Défilement automatique
  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % dataComments.length);
    }, 6000); // Définit l'intervalle de défilement à 6 secondes

    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setActive((prev) => (prev + 1) % dataComments.length);
  };

  const prevSlide = () => {
    setActive((prev) => (prev - 1 + dataComments.length) % dataComments.length);
  };

  return (
    <div className="carousel">
      {dataComments.map((comment, index) => (
        <div
          key={comment._id.$oid}
          className={`item ${index === active ? 'active' : ''}`}
          style={{
            display:
              index === active ||
              index === (active - 1 + dataComments.length) % dataComments.length ||
              index === (active + 1) % dataComments.length
                ? 'block'
                : 'none',
          }}
        >
          <img src={comment.urlImage} alt={comment.username} className="carousel-image" />
          <div className="carousel-content">
            <h4>{comment.username}</h4>
            <h5>{comment.poste}</h5>
            <p>{comment.commentary}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CarouselComments;
