import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Importer useLocation
import MenuToggle from './ButtonOpen/menuToggle';
import Contact from '../contact/Contact';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 750);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const navigate = useNavigate(); // Utiliser useNavigate pour la navigation
  const location = useLocation(); // Utiliser useLocation pour vérifier la page actuelle

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

  const handleHomeClick = () => {
    if (location.pathname === '/') {
      // Si déjà sur la page d'accueil, scroller tout en haut
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Sinon, naviguer vers la page d'accueil
      navigate('/');
    }
  };

  return (
    <header className="header-container">
      {/* Section Desktop */}
      <section className={`header-desktop ${isMobile ? 'hidden' : ''}`}>
        <div className="title_img">
          <img 
            src="http://www.image-heberg.fr/files/17358992922156864569.webp" 
            alt="Logo Axel Grégoire" 
            className="header-logo"
          />
         <h2 className="header-title">
            <span>D</span>
            <span>é</span>
            <span>v</span>
            <span>e</span>
            <span>l</span>
            <span>o</span>
            <span>p</span>
            <span>p</span>
            <span>e</span>
            <span>u</span>
            <span>r</span>
            <span>&nbsp;</span>
            <span>W</span>
            <span>E</span>
            <span>B</span>
          </h2>
        </div>
        <ul className="nav">
          <li onClick={handleHomeClick} style={{ cursor: 'pointer' }}>
            Accueil
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
