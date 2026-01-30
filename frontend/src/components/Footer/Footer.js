import React from 'react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import CarouselComments from './CarouselComments';

const WaveSVG = () => (
  <svg
    className="footer-wave-svg"
    viewBox="0 0 1440 120"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z"
      fill="#ffffff"
    />
  </svg>
);

const Footer = () => {
  const location = useLocation();

  return (
    <footer className="footer">
      {/* Vague SVG */}
      {location.pathname !== '/Avis' && (
        <div className="footer-wave">
          <WaveSVG />
        </div>
      )}

      <div className="carousel-container">
        <CarouselComments />
      </div>
      <div className="footer-content">
        <p>Réalisé par Axel Grégoire</p>
        <div className="footer-icons">
          <a href="https://github.com/Axelads" target="_blank" rel="noopener noreferrer">
            <FaGithub className="footer-icon" />
            <span className="sr-only">Visiter mon profil GitHub</span>
          </a>
          <a href="https://www.linkedin.com/in/axel-gregoire" target="_blank" rel="noopener noreferrer">
            <FaLinkedin className="footer-icon" />
            <span className="sr-only">Visiter mon profil LinkedIn</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
