import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Importer Link et useNavigate
import './menuToggle.scss';

const MenuToggle = ({ openContactModal }) => {
  const navigate = useNavigate(); // Initialiser useNavigate

  const handleProjectsClick = () => {
    navigate('/'); // Naviguer vers la page d'accueil
    setTimeout(() => {
      const projectsSection = document.getElementById('projects');
      if (projectsSection) {
        projectsSection.scrollIntoView({ behavior: 'smooth' }); // Scroller vers la section
      }
    }, 100); // Attendre que la navigation ait lieu avant de scroller
  };

  return (
    <div className="menu-toggle-container">
      <ul className="nav">
        <li>
          <Link to="/">Accueil</Link>
        </li>
        <li>
          <Link to="/About">À propos</Link>
        </li>
        <li onClick={handleProjectsClick} style={{ cursor: 'pointer' }}>
          Projets
        </li>
        <li onClick={openContactModal} style={{ cursor: 'pointer' }}>
          Contact
        </li>
      </ul>
    </div>
  );
};

export default MenuToggle;