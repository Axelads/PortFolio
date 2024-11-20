import React from 'react';
import portraitImage from '../../images/portrait.webp';
import Age from '../age/Age';
import gifPortfolio from '../../images/gif_portfolio_keep_smilling.gif';

const Portrait = ({ openContactModal }) => {
  return (
    <div className="portrait">
      <img src={portraitImage} alt="Portrait" className="portrait-image" />
      <div className="portrait-content">
        <div className="title-portrait">
        <p>À propos</p>
        </div>
        <div className="info-portrait">
          <h1>Axel Grégoire</h1>
          <h2>Développeur WEB</h2>
          <h3><Age birthDate="1990-04-24" /></h3>
        </div>
        <section className="about-me">
          <p>
            <strong>Ancien gérant d'une SARL, maintenant Développeur web passionné</strong>, je suis animé par une forte curiosité pour les nouvelles technologies. Formé via OpenClassrooms et en autodidacte, j'ai acquis des compétences en conception de sites web, aussi bien en frontend qu'en backend, pour répondre aux besoins spécifiques des clients et garantir des solutions fonctionnelles et efficaces.
          </p>
          <p>
            <strong>Ma formation est continue :</strong> je m'actualise constamment pour rester à jour sur les technologies émergentes, notamment dans le domaine de l'intelligence artificielle, un domaine qui m'inspire particulièrement.
          </p>
          <p>
            Si vous recherchez un développeur <strong>enthousiaste</strong>, à l’<strong>écoute</strong> et capable de vous <strong>conseiller efficacement</strong>, je suis la personne qu'il vous faut. <strong>N'hésitez pas à</strong>
          </p>
          <div className="button-container">
              <button onClick={openContactModal} className="contact-open-button">
              Me contacter
              </button>
          </div>
        </section>
      </div>
      <img src={gifPortfolio} alt="Keep Smiling" className="portrait-gif" />
    </div>
  );
};

export default Portrait;