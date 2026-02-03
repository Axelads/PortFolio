import 'aos/dist/aos.css';
import AOS from 'aos';
import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { FaLinkedin } from 'react-icons/fa';
import dataComments from '../assets/Data/DataComments.json';
import '../styles/pages/_avis.scss';

const Avis = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 }); // Initialisation avec durée de l'animation
  }, []);

  return (
    <div className="avis-container">
      <Helmet>
        <title>Avis et recommandations - Axel Grégoire</title>
        <meta name="description" content="Découvrez les avis et recommandations de collègues et mentors sur le travail d'Axel Grégoire, développeur web full stack." />
        <link rel="canonical" href="https://axelgregoire.fr/Avis" />
      </Helmet>
      <h1>
        <span className="animated-title">Ce que disent mes collègues et mentors</span>
      </h1>
      <div className="separator"></div>
      <div className="avis-cards">
        {dataComments.map((comment) => (
          <div key={comment._id.$oid || comment._id} className="avis-card">
            <img
              src={comment.urlImage}
              alt={comment.username}
              className="avis-image"
            />
            <h3>{comment.username}</h3>
            <h4>{comment.poste}</h4>
            <p>{comment.commentary}</p>
            {comment.linkedin && (
              <a 
                href={comment.linkedin} // Correction du href
                target="_blank" 
                rel="noopener noreferrer"
              >
                <FaLinkedin className="linkedin-icon" /> 
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Avis;
