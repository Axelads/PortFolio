import React from 'react';
import MaltIcone from '../Footer/MaltIcone';

// Bouton flottant vers le profil Malt (demandé le 21/11/2026), en bas à gauche : le coin droit est pris par le chat.
// Pilule « Mon profil Malt » sur ordinateur, rond avec la seule fleur Malt sur téléphone (le texte reste lu par les lecteurs d'écran).
const MaltFlottant = () => (
  <a
    className="malt-flottant"
    href="https://www.malt.fr/profile/axelgregoire"
    target="_blank"
    rel="noopener noreferrer"
  >
    <MaltIcone className="malt-flottant__icone" />
    <span className="malt-flottant__texte">Mon profil Malt</span>
  </a>
);

export default MaltFlottant;
