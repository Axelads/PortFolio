import React, { useState, useEffect, useRef } from 'react';
import dataComments from '../../assets/Data/DataComments.json'; // Chemin vers le fichier JSON
import { assezDAvis, ilYa, useAvisGoogle } from '../AvisGoogle/avisGoogle';
import { Etoiles, LogoGoogle } from '../AvisGoogle/Visuels';

// Carrousel au-dessus du pied de page : les avis Google des clients d'abord (à partir de 5 avis sur la fiche, ceux qui
// ont un texte), puis les recommandations de collègues et mentors (DataComments.json).

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

// Photo du compte Google de l'auteur (sans référent : Google refuse parfois l'image sinon), initiales en repli.
// Google la sert en 128 px (« =s128 ») : demandée en 192 px pour rester nette dans la bulle de 80 px sur écran dense.
const photoNette = (url) => url.replace(/=s\d+(?=-|$)/, '=s192');

const AvatarGoogle = ({ avis }) => {
  const [enEchec, setEnEchec] = useState(false);
  if (!avis.photo || enEchec) {
    return (
      <div className="carousel-image carousel-image--initiales" role="img" aria-label={avis.auteur}>
        {initiales(avis.auteur)}
      </div>
    );
  }
  return (
    <img
      src={photoNette(avis.photo)}
      alt={avis.auteur}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className="carousel-image"
      onError={() => setEnEchec(true)}
    />
  );
};

const CarteGoogle = ({ avis, lienFiche }) => (
  <>
    <AvatarGoogle avis={avis} />
    <a className="item-google__source" href={lienFiche} target="_blank" rel="noopener noreferrer" aria-label="Voir tous les avis sur Google (nouvel onglet)">
      <LogoGoogle />
    </a>
    <div className="carousel-content">
      <h3>
        {avis.profil ? (
          <a href={avis.profil} target="_blank" rel="noopener noreferrer">
            {avis.auteur}
          </a>
        ) : (
          avis.auteur
        )}
      </h3>
      <p className="item-google__meta">
        <Etoiles note={avis.note} />
        <span className="item-google__lecteur">{avis.note} sur 5, </span>
        <span>{ilYa(avis.date)}</span>
      </p>
      <p className="item-google__texte">{avis.texte}</p>
    </div>
  </>
);

const CarteCollegue = ({ comment }) => (
  <>
    <AvatarAvis comment={comment} />
    <div className="carousel-content">
      <h3>{comment.username}</h3>
      <p className="carousel-poste">{comment.poste}</p>
      <p>{comment.commentary}</p>
    </div>
  </>
);

const CarouselComments = () => {
  const [active, setActive] = useState(0);
  const releve = useAvisGoogle();

  const avisGoogle = assezDAvis(releve) ? releve.avis.filter((a) => a.texte) : [];
  const elements = [
    ...avisGoogle.map((avis) => ({ cle: `google-${avis.date}-${avis.auteur}`, google: avis })),
    ...dataComments.map((comment) => ({ cle: comment._id.$oid, comment })),
  ];
  const nombre = elements.length;
  const nombreRef = useRef(nombre);
  nombreRef.current = nombre;

  // Effet visuel appliqué aux cartes (recalculé aussi quand les avis Google arrivent)
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
  }, [active, nombre]);

  // Défilement automatique
  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % nombreRef.current);
    }, 6000); // Définit l'intervalle de défilement à 6 secondes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="carousel">
      {elements.map((element, index) => (
        <div
          key={element.cle}
          className={`item ${element.google ? 'item--google' : ''} ${index === active ? 'active' : ''}`}
          style={{
            display:
              index === active || index === (active - 1 + nombre) % nombre || index === (active + 1) % nombre
                ? 'block'
                : 'none',
          }}
        >
          {element.google ? <CarteGoogle avis={element.google} lienFiche={releve.lien} /> : <CarteCollegue comment={element.comment} />}
        </div>
      ))}
    </div>
  );
};

export default CarouselComments;
