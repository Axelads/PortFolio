import 'aos/dist/aos.css';
import AOS from 'aos';
import { useEffect } from 'react';
import Seo from '../components/Seo';
import { FaLinkedin } from 'react-icons/fa';
import dataComments from '../assets/Data/DataComments.json';
import NoteGoogle from '../components/portrait/NoteGoogle';
import { assezDAvis, ilYa, useAvisGoogle } from '../components/AvisGoogle/avisGoogle';
import { AvatarGoogle, Etoiles, LogoGoogle } from '../components/AvisGoogle/Visuels';
import '../styles/pages/_avis.scss';

// Page /Avis : les avis Google des clients d'abord (à partir de 5 avis sur la fiche, comme ailleurs sur le site), puis
// les recommandations de collègues et mentors. Données Google : components/AvisGoogle/avisGoogle.js.

// Le lien de la fiche mène à la lecture des avis ; la même adresse en « writereview » ouvre le formulaire d'avis.
const lienPourDonnerUnAvis = (lienFiche) => lienFiche.replace('/local/reviews?', '/local/writereview?');

const CarteAvisGoogle = ({ avis }) => (
  <article className="avis-card avis-card--google">
    <LogoGoogle className="avis-card__google" />
    <AvatarGoogle avis={avis} className="avis-image" />
    <h3>
      {avis.profil ? (
        <a href={avis.profil} target="_blank" rel="noopener noreferrer">
          {avis.auteur}
        </a>
      ) : (
        avis.auteur
      )}
    </h3>
    <p className="avis-card__note">
      <Etoiles note={avis.note} />
      <span className="avis-card__lecteur">{avis.note} sur 5, </span>
      <span>{ilYa(avis.date)}</span>
    </p>
    {avis.texte ? (
      <p className="avis-card__texte">{avis.texte}</p>
    ) : (
      <p className="avis-card__texte avis-card__texte--vide">Note sans commentaire.</p>
    )}
  </article>
);

const Avis = () => {
  const releve = useAvisGoogle();
  const google = assezDAvis(releve) && releve.avis.length > 0;

  useEffect(() => {
    AOS.init({ duration: 1000 }); // Initialisation avec durée de l'animation
  }, []);

  return (
    <div className="avis-container">
      <Seo
        title="Avis clients et recommandations - Axel Grégoire"
        description="Les avis Google des clients d'Axel Grégoire, développeur web et mobile, et les recommandations de ses collègues et mentors."
        path="/Avis"
      >
        {/* Parisienne n'est utilisée que sur cette page */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Parisienne&display=swap" />
      </Seo>
      <h1>
        <span className="animated-title">Avis clients et recommandations</span>
      </h1>
      <div className="separator"></div>

      {google && (
        <section className="avis-section" aria-labelledby="avis-google-titre">
          <header className="avis-section__tete">
            <h2 id="avis-google-titre">Mes clients, sur Google</h2>
            <div className="avis-section__fiche">
              <NoteGoogle />
              <a
                className="avis-section__donner"
                href={lienPourDonnerUnAvis(releve.lien)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Laisser un avis sur Google
              </a>
            </div>
          </header>
          <div className="avis-cards">
            {releve.avis.map((avis) => (
              <CarteAvisGoogle key={`${avis.date}-${avis.auteur}`} avis={avis} />
            ))}
          </div>
        </section>
      )}

      <section className="avis-section" aria-labelledby="avis-collegues-titre">
        <header className="avis-section__tete">
          <h2 id="avis-collegues-titre">Mes collègues et mentors</h2>
        </header>
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
                  href={comment.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaLinkedin className="linkedin-icon" />
                </a>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Avis;
