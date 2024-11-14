import React, { useState } from 'react';
import Portrait from '../components/portrait/Portrait';
import Header from '../components/Header';
import Contact from '../components/contact/Contact';
import Skills from '../components/Skills/Skills';
import './Home.scss';

const Home = () => {
  const [isContactOpen, setIsContactOpen] = useState(false);

  const openContactModal = () => setIsContactOpen(true);
  const closeContactModal = () => setIsContactOpen(false);

  // Fonction pour ouvrir le PDF dans un nouvel onglet
  const openCV = () => {
    window.open('http://localhost:5001/api/cv', '_blank');
  };

  return (
    <div>
      <Header onContactClick={openContactModal} />
      <Portrait openContactModal={openContactModal} />
      <div className="informations">
        <button onClick={openCV} className="cv-button">
          Voir mon CV
        </button>
        <div className="CardSkill">
        <Skills />
        </div>
      </div>
      <Contact isOpen={isContactOpen} onClose={closeContactModal} />
    </div>
  );
};

export default Home;