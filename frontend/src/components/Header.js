import React, { useState, useEffect } from 'react';
import './Header.scss';

const Header = ({ onContactClick }) => {
  const [isBottom, setIsBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      setIsBottom(scrollPosition >= pageHeight - 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className={`header ${isBottom ? 'hide' : ''}`}>
      <h1 className="header-title">Developper WEB</h1>
      {isBottom ? (
        <div className="scroll-to-top" onClick={scrollToTop}>
          ⬆️
        </div>
      ) : (
        <nav className="nav">
          <ul>
            <li>Accueil</li>
            <li>À propos</li>
            <li>Projets</li>
            <li onClick={onContactClick} style={{ cursor: 'pointer' }}>Contact</li>
          </ul>
        </nav>
      )}
    </header>
  );
};

export default Header;