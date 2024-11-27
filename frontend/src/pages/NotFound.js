import React from 'react';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <h1 className="not-found-title">404</h1>
      <p className="not-found-text">Oups, la page que vous recherchez n'existe pas.</p>
      <a href="/" className="not-found-link">Retourner à l'accueil</a>
    </div>
  );
};

export default NotFound;