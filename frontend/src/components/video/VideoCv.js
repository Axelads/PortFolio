import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pointeurFin = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Fichiers servis depuis public/video (cache 30 jours, cf. .htaccess) :
// changer le nom du fichier pour forcer une mise à jour chez les visiteurs.
const SOURCES = {
  hd: '/video/axel-gregoire-cv-1080.mp4',
  sd: '/video/axel-gregoire-cv-720.mp4',
};
const AFFICHE = {
  petite: '/video/axel-gregoire-cv-960.webp',
  grande: '/video/axel-gregoire-cv-1600.webp',
};
const TITLE_WORDS = ['Mon', 'CV', 'en'];

// Vidéo de présentation (motion design, 86 s, musique). Façade : seule l'affiche est
// chargée (en différé) ; la vidéo n'est téléchargée qu'au clic, puis démarre avec le son.
const VideoCv = () => {
  const sectionRef = useRef(null);
  const cadreRef = useRef(null);
  const videoRef = useRef(null);
  const sourceRef = useRef(SOURCES.hd);
  const [enLecture, setEnLecture] = useState(false);

  // Entrée au défilement : sur-titre, titre mot à mot, chapô, puis le cadre se découvre
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: { trigger: sectionRef.current, start: 'top 78%', toggleActions: 'play none none none' },
      })
        .fromTo('.video-cv-eyebrow', { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.5 })
        .fromTo('.video-cv-title .word > span', { yPercent: 115 }, { yPercent: 0, duration: 0.8, stagger: 0.07, ease: 'expo.out' }, '-=0.3')
        .fromTo('.video-cv-lede', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.5')
        .fromTo(
          '.video-cv-cadre',
          { clipPath: 'inset(10% 7% 10% 7% round 32px)' },
          { clipPath: 'inset(0% 0% 0% 0% round 18px)', duration: 1.2, ease: 'expo.out', clearProps: 'clipPath' },
          '-=0.55'
        )
        // clearProps : rend la main aux transitions CSS du survol une fois l'entrée jouée
        .fromTo('.video-cv-affiche img', { scale: 1.14 }, { scale: 1, duration: 1.5, ease: 'expo.out', clearProps: 'transform' }, '<')
        .fromTo('.video-cv-lecture', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.6)', clearProps: 'transform' }, '-=1.0')
        .fromTo('.video-cv-meta', { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.5 }, '-=0.45')
        .fromTo('.video-cv-actions > *', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, clearProps: 'all' }, '-=0.4');
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Inclinaison au pointeur (souris uniquement) : quickTo, aucune boucle permanente
  useEffect(() => {
    const cadre = cadreRef.current;
    if (!cadre || enLecture || prefersReducedMotion() || !pointeurFin()) return undefined;
    gsap.set(cadre, { transformPerspective: 1400 });
    const versX = gsap.quickTo(cadre, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    const versY = gsap.quickTo(cadre, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const bouger = (e) => {
      const r = cadre.getBoundingClientRect();
      versX(((e.clientX - r.left) / r.width - 0.5) * 6);
      versY(-((e.clientY - r.top) / r.height - 0.5) * 5);
    };
    const quitter = () => { versX(0); versY(0); };
    cadre.addEventListener('pointermove', bouger);
    cadre.addEventListener('pointerleave', quitter);
    return () => {
      cadre.removeEventListener('pointermove', bouger);
      cadre.removeEventListener('pointerleave', quitter);
      gsap.killTweensOf(cadre, 'rotationX,rotationY');
      gsap.set(cadre, { rotationX: 0, rotationY: 0 });
    };
  }, [enLecture]);

  // Au clic : le lecteur remplace l'affiche et démarre (geste utilisateur → le son est autorisé)
  useEffect(() => {
    const video = videoRef.current;
    if (!enLecture || !video) return;
    video.focus({ preventScroll: true });
    const lecture = video.play();
    if (lecture) lecture.catch(() => {}); // le navigateur refuse : les contrôles natifs restent là
  }, [enLecture]);

  const lancer = () => {
    const petitEcran = window.matchMedia('(max-width: 900px)').matches;
    const economie = navigator.connection && navigator.connection.saveData;
    sourceRef.current = petitEcran || economie ? SOURCES.sd : SOURCES.hd;
    setEnLecture(true);
  };

  return (
    <section className="video-cv" ref={sectionRef} aria-labelledby="video-cv-title">
      <header className="video-cv-header">
        <div>
          <p className="video-cv-eyebrow">Présentation vidéo</p>
          <h2 className="video-cv-title" id="video-cv-title">
            {TITLE_WORDS.map((word) => (
              <span className="word" key={word}><span>{word}</span></span>
            ))}
            <span className="word"><span><em>86 secondes.</em></span></span>
          </h2>
        </div>
        <p className="video-cv-lede">
          Parcours, compétences et projets, de Lunello aux agents IA : une vidéo en motion
          design que j'ai codée de bout en bout, image par image.
        </p>
      </header>

      <div className="video-cv-cadre" ref={cadreRef}>
        {enLecture ? (
          <video
            ref={videoRef}
            className="video-cv-video"
            src={sourceRef.current}
            poster={AFFICHE.grande}
            controls
            playsInline
            preload="auto"
            aria-label="Mon CV en 86 secondes : parcours, compétences et projets d'Axel Grégoire"
          />
        ) : (
          <button
            type="button"
            className="video-cv-affiche"
            onClick={lancer}
            aria-label="Lire la vidéo : mon CV en 86 secondes, avec musique"
          >
            <img
              src={AFFICHE.grande}
              srcSet={`${AFFICHE.petite} 960w, ${AFFICHE.grande} 1600w`}
              sizes="(max-width: 1240px) 92vw, 1120px"
              width="1600"
              height="900"
              alt=""
              loading="lazy"
              decoding="async"
            />
            <span className="video-cv-lecture" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
            </span>
            <span className="video-cv-meta" aria-hidden="true">
              <span className="video-cv-meta__titre">Mon CV en mouvement</span>
              <span className="video-cv-meta__infos">1:26 · avec le son</span>
            </span>
          </button>
        )}
      </div>

      <div className="video-cv-actions">
        {!enLecture && (
          <button type="button" className="video-cv-lancer" onClick={lancer}>
            Lancer la vidéo
          </button>
        )}
        {/* Vrai lien (et non un bouton qui navigue en JS) : les robots suivent /cv */}
        <Link to="/cv" className="cv-button">
          Voir mon CV
        </Link>
      </div>
    </section>
  );
};

export default VideoCv;
