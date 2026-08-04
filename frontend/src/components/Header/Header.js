import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Importer useLocation
import { FaSun, FaMoon, FaGithub, FaLinkedin } from 'react-icons/fa';
import Contact from '../contact/Contact';
import AxelLogo from './AxelLogo';
import { useTheme } from '../../contexts/ThemeContext';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 750);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();
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

  // Bloque le scroll du body et ferme le drawer avec la touche Échap
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);
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
    <header className={`header-container ${menuOpen ? 'menu-open' : ''}`}>
      {/* Section Desktop */}
      <section className={`header-desktop ${isMobile ? 'hidden' : ''}`}>
        <div className="title_img">
          <AxelLogo
            size={70}
            smallDotSize={2}
            bigDotSize={4}
            invertLogo={isDark}
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
          <li>
            <Link to="/Avis">Avis</Link>
          </li>
          <li>
            <Link to="/blog">Blog</Link>
          </li>
          <li onClick={openContactModal} style={{ cursor: 'pointer' }}>
            Contact
          </li>
        </ul>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          {isDark ? <FaSun className="theme-icon sun" /> : <FaMoon className="theme-icon moon" />}
        </button>
      </section>

      {/* Section Responsive (mobile) */}
      <section className={`header-responsive ${isMobile ? '' : 'hidden'}`}>
        {/* Barre supérieure épurée */}
        <div className="mobile-bar">
          <button
            className="mobile-bar__brand"
            onClick={() => {
              handleHomeClick();
              closeMenu();
            }}
            aria-label="Retour à l'accueil"
          >
            <AxelLogo
              size={44}
              smallDotSize={2}
              bigDotSize={3}
              invertLogo={isDark}
              className="mobile-bar__logo"
            />
            <span className="mobile-bar__name">Axel Grégoire</span>
          </button>

          <div className="mobile-bar__actions">
            <button
              className="theme-toggle mobile"
              onClick={toggleTheme}
              aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {isDark ? <FaSun className="theme-icon sun" /> : <FaMoon className="theme-icon moon" />}
            </button>
            <button
              className={`hamburger ${menuOpen ? 'is-open' : ''}`}
              onClick={toggleMenu}
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={menuOpen}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        {/* Voile sombre cliquable */}
        <div
          className={`mobile-drawer__overlay ${menuOpen ? 'is-open' : ''}`}
          onClick={closeMenu}
          aria-hidden="true"
        />

        {/* Drawer latéral droit */}
        <nav className={`mobile-drawer ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
          <div className="mobile-drawer__head">
            <span className="mobile-drawer__title">Navigation</span>
            <button
              className="mobile-drawer__close"
              onClick={closeMenu}
              aria-label="Fermer le menu"
            >
              <span></span>
              <span></span>
            </button>
          </div>

          <ul className="mobile-drawer__nav">
            <li style={{ '--i': 0 }}>
              <button
                className={location.pathname === '/' ? 'is-active' : ''}
                onClick={() => {
                  handleHomeClick();
                  closeMenu();
                }}
              >
                Accueil
              </button>
            </li>
            <li style={{ '--i': 1 }}>
              <Link
                to="/About"
                className={location.pathname === '/About' ? 'is-active' : ''}
                onClick={closeMenu}
              >
                À propos
              </Link>
            </li>
            <li style={{ '--i': 2 }}>
              <button
                onClick={() => {
                  handleProjectsClick();
                  closeMenu();
                }}
              >
                Projets
              </button>
            </li>
            <li style={{ '--i': 3 }}>
              <Link
                to="/Avis"
                className={location.pathname === '/Avis' ? 'is-active' : ''}
                onClick={closeMenu}
              >
                Avis
              </Link>
            </li>
            <li style={{ '--i': 4 }}>
              <Link
                to="/blog"
                className={location.pathname.startsWith('/blog') ? 'is-active' : ''}
                onClick={closeMenu}
              >
                Blog
              </Link>
            </li>
            <li style={{ '--i': 5 }}>
              <button
                onClick={() => {
                  openContactModal();
                  closeMenu();
                }}
              >
                Contact
              </button>
            </li>
          </ul>

          <div className="mobile-drawer__footer">
            <span className="mobile-drawer__footer-label">Me suivre</span>
            <div className="mobile-drawer__socials">
              <a
                href="https://github.com/Axelads"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <FaGithub />
              </a>
              <a
                href="https://www.linkedin.com/in/axel-gregoire"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <FaLinkedin />
              </a>
            </div>
          </div>
        </nav>
      </section>

      {/* Modale Contact */}
      {isContactOpen && <Contact isOpen={isContactOpen} onClose={closeContactModal} />}
    </header>
  );
};

export default Header;
