import React, { useState } from 'react';
import Contact from '../components/contact/Contact';

const About = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openContactModal = () => {
    setIsModalOpen(true);
  };

  const closeContactModal = () => {
    setIsModalOpen(false);
  };
  return (
    <div className="about-container">
      <section className="about-intro">
        <h1>À propos de moi</h1>
        <p>
          Bonjour ! Je m'appelle <strong>Axel Grégoire</strong>, développeur web depuis <strong>2023</strong>. Mon
          parcours, riche et varié, m’a conduit jusqu’ici, et je suis ravi de partager mon histoire avec vous.
        </p>
      </section>

      <section className="about-chapter1">
        <img
          src="https://i.ibb.co/x5N7Nm5/About-credit-du-nord.webp"
          alt="Illustration de Crédit du Nord"
          className="chapter-image1"
        />
        <div className="style-chapter1">
        <h2>Mes débuts</h2>
        <p>
          En <strong>2008</strong>, j’ai obtenu mon <strong>Bac Économie et Social</strong> avec une option
          Mathématiques. Ne sachant pas encore vers quel métier m’orienter, ma professeure d’économie m’a conseillé de
          me tourner vers le secteur bancaire, qui correspondait à mes centres d’intérêt : le marché financier, les
          mathématiques et le relationnel client.
        </p>
        <p>
          J’ai alors suivi un <strong>BTS Banque en alternance</strong> avec l’école <strong>CFPB de Marseille</strong>{' '}
          et la banque <strong>Crédit du Nord</strong> à Manosque. Ces deux années m’ont permis de :
        </p>
          <div className="style-liste-chapter1">
            <ul>
              <li>Comprendre les taux d’intérêt et les produits financiers.</li>
              <li>Améliorer mes compétences relationnelles avec les clients.</li>
              <li>Développer mon professionnalisme et apprendre à travailler en équipe.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="about-chapter2">
      <img
          src="https://i.ibb.co/SvRxytx/Marche-Axel-Gregoire.webp"
          alt="Illustration vendeur d'olive sur les marchés"
          className="chapter-image2"
        />
        <div className="style-chapter2">
        <h2>Découverte de la vente et du management</h2>
        <p>
          En <strong>2010</strong>, je décide de changer de domaine pour explorer la <strong>vente directe</strong> avec
          l’entreprise <strong>SunWater</strong>. Cette expérience m’a appris l’autonomie, la gestion de mes rendez-vous
          et la maîtrise des produits proposés.
        </p>
        <p>
          Après deux ans dans ce secteur et un licenciement économique, je me lance dans une nouvelle aventure : créer
          ma propre entreprise. Pendant <strong>10 ans</strong>, j’ai vendu des produits à base d’olives sur les marchés
          de ma région. Cette expérience entrepreneuriale m’a permis de :
        </p>
          <div className="style-liste-chapter2">
            <ul>
              <li>Gérer un stock et des employés.</li>
              <li>Développer des compétences en comptabilité et en gestion.</li>
              <li>Innover pour répondre aux besoins de mes clients.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="about-chapter3">
      <img
          src="https://i.ibb.co/5B0mWHn/transition-olive-informatique.webp"
          alt="Illustration Transition vers l'informatique"
          className="chapter-image3"
        />
        <div className="style-chapter3">
        <h2>Reconnexion avec l’informatique</h2>
        <p>
          Passionné par l’informatique depuis toujours, je décide en <strong>2023</strong> de me reconvertir dans le{' '}
          <strong>développement web</strong>. Je me suis formé chez <strong>OpenClassrooms</strong>, où j’ai appris à
          maîtriser des outils et technologies modernes comme :
        </p>
        <div className="style-liste-chapter3">
            <ul>
              <li>HTML, CSS et JavaScript.</li>
              <li>React pour le frontend.</li>
              <li>Node.js et Express pour le backend.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="about-chapter4">
        <h2>Inspiration et vision d’avenir</h2>
        <p>
          Toujours curieux et en quête d’apprentissage, je m’inspire de plusieurs créateurs de contenu qui démocratisent
          le développement web et les technologies :
        </p>
        <ul>
          <li>
            <a href="https://www.youtube.com/@grafikart" target="_blank" rel="noopener noreferrer">
              Grafikart
            </a>
          </li>
          <li>
            <a href="https://www.youtube.com/@BenjaminCode" target="_blank" rel="noopener noreferrer">
              Benjamin Code
            </a>
          </li>
          <li>
            <a href="https://www.youtube.com/@Micode" target="_blank" rel="noopener noreferrer">
              Micode
            </a>
          </li>
          <li>
            <a href="https://www.youtube.com/@Yass-IA" target="_blank" rel="noopener noreferrer">
              Yassine Sdiri
            </a>
          </li>
        </ul>
      </section>

      <section className="about-contact">
      <img
          src="https://i.ibb.co/qW0drqM/logo-youtube.png"
          alt="logo youtube"
          className="chapter-image4"
        />
        <h2>Me contacter</h2>
        <p>
          Si mon parcours vous intéresse ou si vous souhaitez échanger, n’hésitez pas à{' '}
        </p>
          <div className="button-container">
              <button onClick={openContactModal} className="contact-open-button">
              Me contacter
              </button>
          </div>
      </section>
      <Contact isOpen={isModalOpen} onClose={closeContactModal} />
    </div>
  );
};

export default About;
