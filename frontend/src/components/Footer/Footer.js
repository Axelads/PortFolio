import React from 'react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import CarouselComments from './CarouselComments';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-wave"></div>
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