import React, { useState } from 'react';
import ReactDOM from 'react-dom';

const Contact = ({ isOpen, onClose }) => {
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = {
      name: e.target.name.value,
      email: e.target.email.value,
      message: e.target.message.value,
    };

    try {
      const response = await fetch(process.env.REACT_APP_FETCH_URL + 'contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsConfirmed(true);
      } else {
        alert("Erreur lors de l'envoi du message.");
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert("Erreur lors de l'envoi du message.");
    }
  };

  const handleClickOutside = (e) => {
    if (!isOpen) return; // Évite de fermer si la modale est déjà fermée
    if (e.target.classList.contains('modal')) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="modal" onClick={handleClickOutside}>
      <div className={`modal-content ${isConfirmed ? 'modal-confirmation' : ''}`}>
        {isConfirmed ? (
          <div className="confirmation-message">
            <div className="confirmation-icon">&#10003;</div>
            <h2>Merci, nous vous recontacterons dès que possible.</h2>
            <button onClick={onClose} className="home-button">
              Retourner à la page d'accueil
            </button>
          </div>
        ) : (
          <>
            <span className="close" onClick={onClose}>
              &times;
            </span>
            <h2>Contactez-moi</h2>
            <h3>/!\ Attention en cours de déploiement ! Pas disponible /!\</h3>
            <h4>
              Merci de me contacter directement par mail :{' '}
              <a href="mailto:Professionnel.agregoire@gmail.com">Professionnel.agregoire@gmail.com</a>
            </h4>
            <form onSubmit={handleSubmit}>
              <label htmlFor="name">Nom :</label>
              <input type="text" id="name" name="name" required />

              <label htmlFor="email">Adresse e-mail :</label>
              <input type="email" id="email" name="email" required />

              <label htmlFor="message">Votre message :</label>
              <textarea id="message" name="message" required></textarea>

              <button type="submit" className="submit-button">
                Me contacter
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default Contact;
