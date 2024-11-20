import React, { useEffect, useState } from 'react';


const CarouselComments = () => {
  const [comments, setComments] = useState([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    // Récupère les commentaires depuis l'API
    fetch('http://localhost:5001/api/comments')
      .then((response) => response.json())
      .then((data) => setComments(data))
      .catch((error) => console.error('Erreur lors de la récupération des commentaires:', error));
  }, []);

  useEffect(() => {
    // Applique l'effet visuel aux cartes
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
  }, [active, comments]);

  useEffect(() => {
    // Défilement automatique
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % comments.length);
    }, 4000); // Définit l'intervalle de défilement à 4 secondes

    // Nettoie l'intervalle quand le composant est démonté
    return () => clearInterval(interval);
  }, [comments.length]);

  const nextSlide = () => {
    setActive((prev) => (prev + 1) % comments.length);
  };

  const prevSlide = () => {
    setActive((prev) => (prev - 1 + comments.length) % comments.length);
  };

  return (
    <div className="carousel">
      {comments.map((comment, index) => (
        <div
          key={index}
          className={`item ${index === active ? 'active' : ''}`}
          style={{ display: index === active || index === active - 1 || index === active + 1 ? 'block' : 'none' }}
        >
          <img src={comment.urlImage} alt={comment.username} className="carousel-image" />
          <div className="carousel-content">
            <h4>{comment.username}</h4>
            <h5>{comment.poste}</h5>
            <p>{comment.commentary}</p>
          </div>
        </div>
      ))}
      {/* <button id="prev" onClick={prevSlide}>{'<'}</button>
<button id="next" onClick={nextSlide}>{'>'}</button> */}
    </div>
  );
};

export default CarouselComments;
