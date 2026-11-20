import React, { useState } from 'react';
import Seo from '../components/Seo';
import Portrait from '../components/portrait/Portrait';
import Contact from '../components/contact/Contact';
import Skills from '../components/Skills/Skills';
import Projects from '../components/Projects/Projects';
import VideoCv from '../components/video/VideoCv';
import DerniersArticles from '../components/Blog/DerniersArticles';
import ClientsConfiance from '../components/Clients/ClientsConfiance';
import SavoirFaire from '../components/SavoirFaire/SavoirFaire';

// Données structurées de la vidéo de présentation (résultats vidéo Google)
const VIDEO_LD = {
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: 'Axel Grégoire — mon CV en 86 secondes',
  description: "Vidéo de présentation en motion design : parcours (quinze ans de commerce puis développeur depuis 2023), 36 compétences, projets dont l'application Lunello.",
  thumbnailUrl: ['https://axelgregoire.fr/video/axel-gregoire-cv-1600.webp'],
  uploadDate: '2026-10-08',
  duration: 'PT1M26S',
  contentUrl: 'https://axelgregoire.fr/video/axel-gregoire-cv-1080.mp4',
  inLanguage: 'fr',
  creator: { '@type': 'Person', name: 'Axel Grégoire', url: 'https://axelgregoire.fr' },
};

const Home = () => {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const openContactModal = () => setIsContactOpen(true);
  const closeContactModal = () => setIsContactOpen(false);

  return (
    <div>
      <Seo
        title="Axel Grégoire, développeur web full stack React et Node.js"
        description="Sites web, applications mobiles et outils sur mesure en React, Node.js et PocketBase. Parcourez les projets d'Axel et contactez-le."
        path="/"
        jsonLd={VIDEO_LD}
      />
      <Portrait openContactModal={openContactModal} />
      <ClientsConfiance />
      <SavoirFaire />
      <div className="informations">
        <div className="CardVideo">
          <VideoCv />
        </div>
        <div className="CardSkill">
          <Skills />
        </div>
        <div id="projects">
          <Projects selection />
        </div>
        <div id="articles">
          <DerniersArticles />
        </div>
      </div>
      <Contact isOpen={isContactOpen} onClose={closeContactModal} />
    </div>
  );
};

export default Home;
