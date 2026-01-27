import React, { useState } from "react";
import ReactDOM from "react-dom";
import emailjs from "emailjs-com";

const Contact = ({ isOpen, onClose }) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isValid, setIsValid] = useState(false); // ✅ Vérifie si le message a 50+ caractères

  // ✅ Gestion des changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // ✅ Vérifie si le message contient au moins 50 caractères
    if (name === "message") {
      setIsValid(value.length >= 50);
    }
  };

  // ✅ Envoi du mail avec EmailJS
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isValid) {
      alert("❌ Votre message doit contenir au moins 50 caractères.");
      return;
    }

    emailjs
      .send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        {
          from_name: formData.name,
          from_email: formData.email,
          message: formData.message,
        },
        process.env.REACT_APP_EMAILJS_USER_ID
      )
      .then(() => {
        setIsConfirmed(true);
        setFormData({ name: "", email: "", message: "" }); // Reset du formulaire
        setIsValid(false); // Réinitialise l'état du bouton
      })
      .catch((error) => {
        console.error("Erreur lors de l'envoi de l'email:", error);
        alert("❌ Une erreur est survenue, essayez encore !");
      });
  };

  const handleClickOutside = (e) => {
    if (!isOpen) return; // Évite de fermer si la modale est déjà fermée
    if (e.target.classList.contains("modal")) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="modal" onClick={handleClickOutside}>
      <div className={`modal-content ${isConfirmed ? "modal-confirmation" : ""}`}>
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
            <p>📧 Vous pouvez aussi me contacter par email : <a href="mailto:Professionnel.agregoire@gmail.com">Professionnel.agregoire@gmail.com</a></p>
            <form onSubmit={handleSubmit}>
              <label htmlFor="name">Nom :</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <label htmlFor="email">Adresse e-mail :</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <label htmlFor="message">Votre message :</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                placeholder="Écrivez votre message ici (min. 50 caractères)"
              ></textarea>

              {/* ✅ Changement dynamique de la couleur du bouton */}
              <button type="submit" className={`submit-button ${isValid ? "valid" : ""}`}>
                Envoyer le message
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
