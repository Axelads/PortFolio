import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { URL_API_TABLEAU_DE_BORD } from "../../pages/TableauDeBord/constantes";
import { FaTimes, FaUser, FaEnvelope, FaPaperPlane, FaCheck, FaLinkedin, FaGithub, FaBriefcase } from "react-icons/fa";

// Types proposés dans la version « demande de devis » (porte « J'ai un projet » du haut de l'accueil).
const TYPES_PROJET = ["Site vitrine", "Boutique en ligne", "Application mobile", "Outil sur mesure", "Autre"];

// Formulaire de contact en fenêtre. Le message part par l'API d'Axel (POST /contact, SMTP o2switch) et arrive dans sa
// boîte contact@axelgregoire.fr ; EmailJS n'est plus utilisé (20/11/2026).
// `devis` : version demande de devis, avec le type de projet, ouverte par « J'ai un projet ».
const Contact = ({ isOpen, onClose, devis = false }) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [erreur, setErreur] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: "",
    message: "",
    site: "", // champ piège : invisible pour un humain, rempli par les robots (l'API ignore alors le message)
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

  const isValid = charCount >= minChars && formData.name && formData.email && (!devis || formData.type);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isValid) {
      return;
    }

    setIsLoading(true);
    setErreur("");

    const MESSAGE_ECHEC = "L'envoi n'a pas abouti. Réessayez, ou écrivez-moi directement à Professionnel.agregoire@gmail.com.";
    fetch(`${URL_API_TABLEAU_DE_BORD}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify({
        devis,
        type: devis ? formData.type : undefined,
        nom: formData.name,
        email: formData.email,
        message: formData.message,
        site: formData.site,
      }),
    })
      .then(async (reponse) => {
        if (!reponse.ok) {
          const corps = await reponse.json().catch(() => null);
          throw new Error(corps?.erreur || MESSAGE_ECHEC);
        }
        setIsLoading(false);
        setIsConfirmed(true);
        setFormData({ name: "", email: "", type: "", message: "", site: "" });
        setCharCount(0);
      })
      .catch((error) => {
        setIsLoading(false);
        // Erreur expliquée par l'API (formulaire incomplet, trop d'envois) ou réseau : un message lisible, jamais muet.
        setErreur(error.message && !/fetch|network/i.test(error.message) ? error.message : MESSAGE_ECHEC);
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
            <h2 className="contact-success__title">Message envoyé</h2>
            <p className="contact-success__text">
              {devis
                ? "Merci, j'ai bien reçu votre projet. Je reviens vers vous avec mes questions, puis un devis."
                : "Merci pour votre message. Je vous réponds au plus vite."}
            </p>
            <button onClick={handleClose} className="contact-success__btn">
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="contact-header">
              <h2 className="contact-header__title">{devis ? "Parlons de votre projet" : "Contactez-moi"}</h2>
              <p className="contact-header__subtitle">
                {devis
                  ? "Quelques lignes suffisent : je reviens vers vous avec mes questions, puis un devis."
                  : "Une question, un projet ? N'hésitez pas à m'écrire."}
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
                <a href="https://github.com/Axelads" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
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

              {devis && (
                <div className="contact-form__group">
                  <div className="contact-form__icon">
                    <FaBriefcase />
                  </div>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    aria-label="Type de projet"
                    className="contact-form__input contact-form__select"
                  >
                    <option value="" disabled>Type de projet</option>
                    {TYPES_PROJET.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Champ piège : hors de l'écran, sauté au clavier, ignoré des lecteurs d'écran. */}
              <div className="contact-form__piege" aria-hidden="true">
                <label htmlFor="site">Ne pas remplir</label>
                <input type="text" id="site" name="site" value={formData.site} onChange={handleChange} tabIndex={-1} autoComplete="off" />
              </div>

              <div className="contact-form__group contact-form__group--textarea">
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={devis ? "Votre activité, ce que le site ou l'app doit faire, une échéance si vous en avez une…" : "Votre message…"}
                  required
                  className="contact-form__textarea"
                ></textarea>
                <div className={`contact-form__counter ${charCount >= minChars ? "contact-form__counter--valid" : ""}`}>
                  {charCount}/{minChars} caractères minimum
                </div>
              </div>

              {erreur && (
                <p className="contact-form__erreur" role="alert">
                  {erreur}
                </p>
              )}

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
                    <span>{devis ? "Envoyer ma demande" : "Envoyer"}</span>
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
