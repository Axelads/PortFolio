import React, { useContext, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { LoadingContext } from '../../contexts/LoadingContext';
import NoteGoogle from '../portrait/NoteGoogle';
import portrait from '../../images/portrait.jpg';
// WebP animé (7 images, ~0,3 Mo), chargé sur ordinateur seulement.
import keepSmiling from '../../images/keep_smiling.webp';

// Haut de l'accueil (refonte du 20/11/2026, planche validée par Axel) : la promesse, deux portes de même poids
// (clients et recruteurs), la note Google et le nombre de projets ; à droite, le pop art « Keep smiling » entier et
// le portrait posé dans son coin vide. Sur téléphone, pas de pop art : le portrait passe à côté de la note Google.

const TITRE = 'Je conçois des sites et des apps sur-mesure, du design au déploiement.';
// Image vide pour les petits écrans : le navigateur ne télécharge pas le WebP animé.
const IMAGE_VIDE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const mouvementReduit = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const Fleche = () => (
  <svg className="porte__fleche" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const HautDePage = () => {
  const racineRef = useRef(null);
  const { isFirstLoad, splashFading } = useContext(LoadingContext);
  // L'entrée se joue quand le haut de page devient visible : dès le montage, ou à la fin de l'intro vidéo.
  const visible = !isFirstLoad || splashFading;
  const jouee = useRef(false);

  useEffect(() => {
    if (!visible || jouee.current || mouvementReduit()) return undefined;
    jouee.current = true;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'expo.out' } })
        // Le titre se construit mot par mot, chaque mot remonte de son masque.
        .fromTo('.haut-de-page__titre .mot > span', { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.05 })
        .fromTo('.haut-de-page__chapo', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, clearProps: 'all' }, '-=0.6')
        .fromTo('.porte', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, clearProps: 'all' }, '-=0.5')
        .fromTo('.haut-de-page__preuves', { opacity: 0 }, { opacity: 1, duration: 0.6, clearProps: 'all' }, '-=0.4')
        .fromTo('.haut-de-page__popart', { opacity: 0, x: 40, rotate: 2 }, { opacity: 1, x: 0, rotate: 0, duration: 1.1, clearProps: 'all' }, 0.15)
        .fromTo('.haut-de-page__portrait', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.6)', clearProps: 'all' }, 0.7);
    }, racineRef);
    return () => ctx.revert();
  }, [visible]);

  return (
    <section className="haut-de-page" ref={racineRef} aria-labelledby="haut-de-page-titre">
      <div className="haut-de-page__texte">
        <h1 id="haut-de-page-titre" className="haut-de-page__titre">
          {TITRE.split(' ').map((mot, i) => (
            <React.Fragment key={i}>
              {i > 0 && ' '}
              <span className="mot"><span>{mot}</span></span>
            </React.Fragment>
          ))}
        </h1>
        <p className="haut-de-page__chapo">
          Je suis Axel Grégoire, développeur web &amp; mobile à Rougiers (Var), en freelance et ouvert à un CDI.
          Quinze ans de commerce avant le code&nbsp;: je pars de votre métier, jamais d'un modèle.
        </p>

        <div className="haut-de-page__portes">
          <a className="porte porte--projet" href="#savoir-faire">
            <span className="porte__titre">J'ai un projet <Fleche /></span>
            <span className="porte__texte">Des sites pensés pour chaque client, une méthode, une demande de devis.</span>
          </a>
          <Link className="porte porte--recrute" to="/cv">
            <span className="porte__titre">Je recrute <Fleche /></span>
            <span className="porte__texte">Mon CV, ma stack, ma vidéo de 86&nbsp;secondes, ma disponibilité.</span>
          </Link>
        </div>

        <div className="haut-de-page__preuves">
          <img
            className="haut-de-page__portrait-mobile"
            src={portrait}
            alt=""
            width="200"
            height="200"
            decoding="async"
          />
          <NoteGoogle />
          <Link className="haut-de-page__projets" to="/projets">
            <b>27 projets</b> à voir
          </Link>
        </div>
      </div>

      <div className="haut-de-page__visuel">
        <picture>
          <source media="(max-width: 900px)" srcSet={IMAGE_VIDE} />
          <img
            className="haut-de-page__popart"
            src={keepSmiling}
            alt="Illustration pop art : « Gardez la motivation », « Keep smiling »"
            width="1100"
            height="704"
            decoding="async"
          />
        </picture>
        <img
          className="haut-de-page__portrait"
          src={portrait}
          alt="Portrait d'Axel Grégoire"
          width="200"
          height="200"
          decoding="async"
        />
      </div>
    </section>
  );
};

export default HautDePage;
