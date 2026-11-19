import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import portraitImage from '../../images/portrait.jpg';
import Age from '../age/Age';
import PrioritySkills from './PrioritySkills';
import NoteGoogle from './NoteGoogle';
// WebP animé (7 images, ~0,3 Mo) à la place du GIF de 4,1 Mo
import keepSmiling from '../../images/keep_smiling.webp';

const Portrait = ({ openContactModal }) => {
  const portraitRef = useRef(null);
  const aboutMeRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();

    // Animation du portrait (glisse de gauche à droite)
    tl.fromTo(
      portraitRef.current,
      { x: -300, opacity: 0 }, // Départ : hors écran à gauche et invisible
      { x: 0, opacity: 1, duration: 1.2, ease: "power2.out" }
    )
    // Animation de la section "about-me" (descend de haut en bas).
    // Démarre presque en même temps : ce bloc de texte est le LCP de la page,
    // tant qu'il est à opacity 0 le navigateur ne le compte pas comme peint.
    .fromTo(
      aboutMeRef.current,
      { y: -50, opacity: 0 }, // Départ : hors écran en haut et invisible
      { y: 0, opacity: 1, duration: 1.1, ease: "power2.out" },
      "-=1.05"
    );

  }, []);

  return (
    <div className="portrait">
      {/* Image du portrait avec animation */}
      <img
        ref={portraitRef}
        src={portraitImage}
        alt="Portrait_Axel_Gregoire"
        title="Portrait Axel Grégoire"
        className="portrait-image"
      />

      <div className="portrait-content">
        <section className="title-portrait">
          {/* Libellé de section, pas un titre : le premier titre de la page doit être le H1 « Axel Grégoire » */}
          <p>À propos</p>
        </section>
        <div className="info-portrait">
          <div className="info-portrait__row">
            <div>
              <h1>Axel Grégoire</h1>
              <h2>Développeur WEB</h2>
              <p className="portrait-age"><Age birthDate="1990-04-24" /></p>
              <p className="portrait-tagline">Freelance — Rougiers (Var) · à distance</p>
              <NoteGoogle />
            </div>
            <PrioritySkills />
          </div>
        </div>
        
        {/* Section about-me avec animation */}
        <section className="about-me" ref={aboutMeRef}>
          <p>
            <strong>Ancien gérant d'une SARL, maintenant Développeur web passionné</strong>, je suis animé par une forte curiosité pour les nouvelles technologies. Formé via OpenClassrooms et en autodidacte, j'ai acquis des compétences en conception de sites web, aussi bien en frontend qu'en backend, pour répondre aux besoins spécifiques des clients et garantir des solutions fonctionnelles et efficaces.
          </p>
          <p>
            <strong>Ma formation est continue :</strong> je m'actualise constamment pour rester à jour sur les technologies émergentes, notamment dans le domaine de l'intelligence artificielle, un domaine qui m'inspire particulièrement.
          </p>
          <p>
            Si vous recherchez un développeur <strong>enthousiaste</strong>, à l’<strong>écoute</strong> et capable de vous <strong>conseiller efficacement</strong>, je suis la personne qu'il vous faut. <strong>N'hésitez pas à</strong>
          </p>
          <div className="button-container">
              <button onClick={openContactModal} className="contact-open-button">
              ! Parlons de votre projet !
              </button>
          </div>
        </section>
      </div>
      <img
        src={keepSmiling}
        alt="Illustration pop art : Keep Smiling"
        title="Keep Smiling"
        width="1100"
        height="704"
        decoding="async"
        className="portrait-gif"
      />
    </div>
  );
};

export default Portrait;
