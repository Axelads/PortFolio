import React, { useState } from 'react';
import Portrait from '../components/portrait/Portrait';
import Header from '../components/Header';
import Contact from '../components/contact/Contact';
import Skills from '../components/Skills/Skills';
import Projects from '../components/Projects/Projects';
import Footer from '../components/Footer/Footer';
import './Home.scss';

const Home = () => {
  const [isContactOpen, setIsContactOpen] = useState(false);

  const openContactModal = () => setIsContactOpen(true);
  const closeContactModal = () => setIsContactOpen(false);

  // Fonction pour ouvrir le PDF
  const openCV = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/cv');
      const data = await response.json();
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        alert('Aucun CV disponible pour le moment.');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du CV :', error);
      alert('Une erreur est survenue lors de l\'ouverture du CV.');
    }
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
        <Projects />
      </div>
      <Contact isOpen={isContactOpen} onClose={closeContactModal} />
      <Footer />
    </div>
  );
};

export default Home;