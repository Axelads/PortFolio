import React, { useState, useEffect } from 'react';
import dataComments from '../../assets/Data/DataComments.json'; // Chemin vers le fichier JSON

// Initiales (deux lettres) d'un avis sans photo : les photos de profil LinkedIn portent un jeton qui expire.
const initiales = (nom) =>
  String(nom)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0].toUpperCase())
    .join('');

const AvatarAvis = ({ comment }) => {
  const [enEchec, setEnEchec] = useState(false);
  const ouvrirLinkedIn = comment.linkedin ? () => window.open(comment.linkedin, '_blank', 'noopener') : undefined;
  const style = { cursor: comment.linkedin ? 'pointer' : 'default' };

  if (!comment.urlImage || enEchec) {
    return (
      <div
        className="carousel-image carousel-image--initiales"
        role="img"
        aria-label={comment.username}
        onClick={ouvrirLinkedIn}
        style={style}
      >
        {initiales(comment.username)}
      </div>
    );
  }
  return (
    <img
      src={comment.urlImage}
      alt={comment.username}
      loading="lazy"
      decoding="async"
      className="carousel-image"
      onClick={ouvrirLinkedIn}
      style={style}
      onError={() => setEnEchec(true)}
    />
  );
};

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
          <AvatarAvis comment={comment} />
          <div className="carousel-content">
            <h3>{comment.username}</h3>
            <p className="carousel-poste">{comment.poste}</p>
            <p>{comment.commentary}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CarouselComments;
