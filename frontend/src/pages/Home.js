import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import Portrait from '../components/portrait/Portrait';
import Contact from '../components/contact/Contact';
import Skills from '../components/Skills/Skills';
import Projects from '../components/Projects/Projects';
import LinkedInPosts from '../components/LinkedInPosts/LinkedInPosts';

const Home = () => {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const navigate = useNavigate();

  const openContactModal = () => setIsContactOpen(true);
  const closeContactModal = () => setIsContactOpen(false);

  // CV en ligne (/cv), imprimable en PDF — remplace l'ancien PDF hébergé
  const openCV = () => navigate('/cv');

  return (
    <div>
      <Helmet>
        <title>Axel Grégoire - Développeur Web Full Stack | React, Node.js</title>
        <meta name="description" content="Portfolio d'Axel Grégoire, développeur web full stack spécialisé en React, Node.js, MongoDB et PocketBase. Découvrez mes projets et contactez-moi." />
        <link rel="canonical" href="https://axelgregoire.fr/" />
      </Helmet>
      <Portrait openContactModal={openContactModal} />
      <div className="informations">
        <button onClick={openCV} className="cv-button">
          Voir mon CV
        </button>
        <div className="CardSkill">
          <Skills />
        </div>
        <div id="projects">
          <Projects />
        </div>
        <div id="linkedin">
          <LinkedInPosts />
        </div>
      </div>
      <Contact isOpen={isContactOpen} onClose={closeContactModal} />
    </div>
  );
};

export default Home;
