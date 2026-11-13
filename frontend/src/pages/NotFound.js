import React from 'react';
// Avatar dessiné d'Axel, expression « surprise » (planche d'expressions v3, détourée).
import avatarSurpris from '../images/avatar/avatar-surprise.webp';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <img className="not-found-avatar" src={avatarSurpris} alt="" width="236" height="338" />
      <h1 className="not-found-title">404</h1>
      <p className="not-found-text">Oups, la page que vous recherchez n'existe pas.</p>
      <a href="/" className="not-found-link">Retourner à l'accueil</a>
    </div>
  );
};

export default NotFound;