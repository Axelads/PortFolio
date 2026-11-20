import React, { useState, useEffect, useRef } from 'react';
import dataComments from '../../assets/Data/DataComments.json'; // Chemin vers le fichier JSON
import { assezDAvis, ilYa, useAvisGoogle } from '../AvisGoogle/avisGoogle';
import { AvatarGoogle, Etoiles, LogoGoogle } from '../AvisGoogle/Visuels';

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

const CarteGoogle = ({ avis, lienFiche }) => (
  <>
    <AvatarGoogle avis={avis} className="carousel-image" />
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

// Boucle sans fin : chaque carte se place selon sa distance CIRCULAIRE à l'avis actif (après le dernier vient le
// premier), jamais selon son rang dans la liste, sinon tout le paquet repartait en arrière à la fin.
// Places visibles : -1 (gauche), 0 (centre), +1 (droite) ; ±2 = coulisses, invisibles.
const DUREE_SORTIE = 600; // ms, un peu plus que la transition de .item (0,5 s)

const distanceCirculaire = (index, active, nombre) => {
  const d = (((index - active) % nombre) + nombre) % nombre;
  return d > nombre / 2 ? d - nombre : d;
};

const styleDePlace = (place) => {
  if (place === 0) {
    return { transform: 'none', zIndex: 1, filter: 'none', opacity: 1, visibility: 'visible' };
  }
  const pas = Math.min(Math.abs(place), 2);
  const cote = Math.sign(place);
  return {
    transform: `translateX(${cote * 120 * pas}px) scale(${1 - 0.2 * pas}) perspective(16px) rotateY(${-cote}deg)`,
    zIndex: -pas,
    filter: 'blur(5px)',
    opacity: pas > 1 ? 0 : 0.6,
    // En coulisses : invisible pendant tout son trajet (la visibilité ne bascule qu'en fin de transition).
    visibility: pas > 1 ? 'hidden' : 'visible',
  };
};

const CarouselComments = () => {
  const [active, setActive] = useState(0);
  // Vrai juste après un pas : la carte qui quitte la gauche s'éloigne encore à gauche en s'effaçant,
  // avant de passer en coulisses à droite pour revenir plus tard.
  const [sortie, setSortie] = useState(false);
  const releve = useAvisGoogle();

  const avisGoogle = assezDAvis(releve) ? releve.avis.filter((a) => a.texte) : [];
  const elements = [
    ...avisGoogle.map((avis) => ({ cle: `google-${avis.date}-${avis.auteur}`, google: avis })),
    ...dataComments.map((comment) => ({ cle: comment._id.$oid, comment })),
  ];
  const nombre = elements.length;
  // Le nombre de cartes change quand les avis Google arrivent : l'intervalle lit toujours la valeur à jour.
  const nombreRef = useRef(nombre);
  nombreRef.current = nombre;
  const courant = nombre ? active % nombre : 0;

  // Défilement automatique, toujours vers la droite
  useEffect(() => {
    let finSortie;
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % nombreRef.current);
      setSortie(true);
      clearTimeout(finSortie);
      finSortie = setTimeout(() => setSortie(false), DUREE_SORTIE);
    }, 6000); // Définit l'intervalle de défilement à 6 secondes

    return () => {
      clearInterval(interval);
      clearTimeout(finSortie);
    };
  }, []);

  // Carte qui était à gauche avant ce pas (à 4 cartes, sa place circulaire est déjà +2, à droite).
  const sortante = nombre >= 4 ? (courant - 2 + nombre) % nombre : -1;

  return (
    <div className="carousel">
      {elements.map((element, index) => {
        const place = sortie && index === sortante ? -2 : distanceCirculaire(index, courant, nombre);
        return (
          <div
            key={element.cle}
            className={`item ${element.google ? 'item--google' : ''} ${place === 0 ? 'active' : ''}`}
            style={styleDePlace(place)}
            aria-hidden={Math.abs(place) > 1 || undefined}
          >
            {element.google ? <CarteGoogle avis={element.google} lienFiche={releve.lien} /> : <CarteCollegue comment={element.comment} />}
          </div>
        );
      })}
    </div>
  );
};

export default CarouselComments;
