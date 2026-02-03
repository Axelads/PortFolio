import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import emailjs from "emailjs-com";
import { FaTimes, FaUser, FaEnvelope, FaPaperPlane, FaCheck, FaLinkedin, FaGithub } from "react-icons/fa";

const Contact = ({ isOpen, onClose }) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [charCount, setCharCount] = useState(0);
  const minChars = 50;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "message") {
      setCharCount(value.length);
    }
  };

  const isValid = charCount >= minChars && formData.name && formData.email;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isValid) {
      return;
    }

    setIsLoading(true);

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
        setIsLoading(false);
        setIsConfirmed(true);
        setFormData({ name: "", email: "", message: "" });
        setCharCount(0);
      })
      .catch((error) => {
        setIsLoading(false);
        console.error("Erreur lors de l'envoi:", error);
      });
  };

  const handleClickOutside = (e) => {
    if (e.target.classList.contains("contact-modal-overlay")) {
      onClose();
      setIsConfirmed(false);
    }
  };

  const handleClose = () => {
    onClose();
    setIsConfirmed(false);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="contact-modal-overlay" onClick={handleClickOutside}>
      <div className={`contact-modal ${isConfirmed ? "contact-modal--success" : ""}`}>
        <button className="contact-modal__close" onClick={handleClose} aria-label="Fermer">
          <FaTimes />
        </button>

        {isConfirmed ? (
          <div className="contact-success">
            <div className="contact-success__icon">
              <FaCheck />
            </div>
            <h2 className="contact-success__title">Message envoye</h2>
            <p className="contact-success__text">
              Merci pour votre message. Je vous recontacterai dans les plus brefs delais.
            </p>
            <button onClick={handleClose} className="contact-success__btn">
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="contact-header">
              <h2 className="contact-header__title">Contactez-moi</h2>
              <p className="contact-header__subtitle">
                Une question, un projet ? N'hesitez pas a me contacter.
              </p>
            </div>

            <div className="contact-info">
              <a href="mailto:Professionnel.agregoire@gmail.com" className="contact-info__email">
                <FaEnvelope />
                <span>Professionnel.agregoire@gmail.com</span>
              </a>
              <div className="contact-info__social">
                <a href="https://www.linkedin.com/in/axel-gregoire/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <FaLinkedin />
                </a>
                <a href="https://github.com/Ostiic" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <FaGithub />
                </a>
              </div>
            </div>

            <div className="contact-divider">
              <span>ou envoyez un message</span>
            </div>

            <form onSubmit={handleSubmit} className="contact-form">
              <div className="contact-form__group">
                <div className="contact-form__icon">
                  <FaUser />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Votre nom"
                  required
                  className="contact-form__input"
                />
              </div>

              <div className="contact-form__group">
                <div className="contact-form__icon">
                  <FaEnvelope />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Votre email"
                  required
                  className="contact-form__input"
                />
              </div>

              <div className="contact-form__group contact-form__group--textarea">
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Votre message..."
                  required
                  className="contact-form__textarea"
                ></textarea>
                <div className={`contact-form__counter ${charCount >= minChars ? "contact-form__counter--valid" : ""}`}>
                  {charCount}/{minChars} caracteres minimum
                </div>
              </div>

              <button
                type="submit"
                className={`contact-form__submit ${isValid ? "contact-form__submit--valid" : ""}`}
                disabled={!isValid || isLoading}
              >
                {isLoading ? (
                  <span className="contact-form__loading"></span>
                ) : (
                  <>
                    <FaPaperPlane />
                    <span>Envoyer</span>
                  </>
                )}
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
