import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Importer useNavigate
import MenuToggle from './ButtonOpen/menuToggle';
import Contact from '../contact/Contact';


const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 750);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const navigate = useNavigate(); // Utiliser useNavigate pour la navigation

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 750);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const openContactModal = () => setIsContactOpen(true);

  const closeContactModal = () => setIsContactOpen(false);

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
    <header className="header-container">
      {/* Section Desktop */}
      <section className={`header-desktop ${isMobile ? 'hidden' : ''}`}>
        <p className="header-title">Développeur WEB</p>
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
      </section>

      {/* Section Responsive */}
      <section className={`header-responsive ${isMobile ? '' : 'hidden'}`}>
        <button className="menu-button" onClick={toggleMenu}>
          {menuOpen ? '✕' : '☰'}
        </button>
        {menuOpen && (
          <div className="menu-content">
            <MenuToggle openContactModal={openContactModal} />
          </div>
        )}
      </section>

      {/* Modale Contact */}
      {isContactOpen && <Contact isOpen={isContactOpen} onClose={closeContactModal} />}
    </header>
  );
};

export default Header;
