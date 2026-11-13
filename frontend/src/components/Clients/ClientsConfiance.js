import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FaPause, FaPlay } from 'react-icons/fa';
import CLIENTS from './clients';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const TITRE = [
  { mot: 'Ils' },
  { mot: 'nous' },
  { mot: 'ont' },
  { mot: 'fait' },
  { mot: 'confiance', accent: true },
];

// La piste contient deux moitiés identiques et glisse d'une moitié avant de reboucler.
// Deux séries par moitié (14 plaques, ≈ 3 400 px sur ordinateur) : un écran de 2 560 px ne voit jamais de trou.
const SERIES_PAR_MOITIE = 2;
// Allure de croisière, en pixels par seconde.
const VITESSE = 38;
// Lancement : la bande part à ce multiple de son allure et ralentit jusqu'à la croisière (inertie d'une bobine).
const ELAN = 24;

// Plaque d'affichage seul : ni lien, ni bouton.
const Plaque = ({ client }) => (
  <div className="client">
    {!client.logotype && (
      <span className="client__logo">
        <img src={client.logo} alt="" width="52" height="52" decoding="async" />
      </span>
    )}
    <span className="client__texte">
      {client.logotype ? (
        <img className="client__logotype" src={client.logo} alt={client.nom} width="2421" height="455" decoding="async" />
      ) : (
        <span className="client__nom">{client.nom}</span>
      )}
      <span className="client__activite">{client.activite}</span>
    </span>
  </div>
);

const Serie = ({ prefixe }) =>
  CLIENTS.map((client) => (
    <li key={`${prefixe}-${client.id}`}>
      <Plaque client={client} />
    </li>
  ));

const ClientsConfiance = () => {
  const sectionRef = useRef(null);
  const voieRef = useRef(null);
  const pisteRef = useRef(null);
  const boucleRef = useRef(null);
  // Ce qui retient la bande : pause demandée, pointeur posé dessus pour lire.
  const pauseRef = useRef(false);
  const survolRef = useRef(false);
  const [enPause, setEnPause] = useState(false);

  const allure = () => (pauseRef.current || survolRef.current ? 0 : 1);

  const rejoindreAllure = (duree) => {
    const boucle = boucleRef.current;
    if (!boucle) return;
    gsap.to(boucle, { timeScale: allure(), duration: duree, ease: 'power2.out', overwrite: true });
  };

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const section = sectionRef.current;
    const voie = voieRef.current;
    const piste = pisteRef.current;
    let lancee = false;

    const ctx = gsap.context(() => {
      const moitie = piste.scrollWidth / 2;
      const boucle = gsap.to(piste, {
        xPercent: -50,
        ease: 'none',
        duration: moitie / VITESSE,
        repeat: -1,
        paused: true,
      });
      boucleRef.current = boucle;

      // Hors de l'écran, la bande s'arrête. À l'écran, le défilement de la page la relance : plus on fait défiler
      // vite, plus elle file, puis elle retrouve son allure.
      const visibilite = ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => {
          if (!lancee) return;
          if (self.isActive) boucle.play();
          else boucle.pause();
        },
        onUpdate: (self) => {
          if (!lancee || allure() === 0) return;
          const cible = 1 + Math.min(Math.abs(self.getVelocity()) / 260, 7);
          if (cible <= boucle.timeScale() + 0.05) return;
          gsap.to(boucle, {
            timeScale: cible,
            duration: 0.25,
            ease: 'power2.out',
            overwrite: true,
            onComplete: () => rejoindreAllure(1.6),
          });
        },
      });

      // Séquence d'entrée : le titre monte mot à mot, puis la bande arrive lancée et ralentit jusqu'à sa croisière.
      gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: { trigger: section, start: 'top 85%', once: true },
      })
        .fromTo('.clients__titre .mot > span', { yPercent: 110 }, { yPercent: 0, duration: 0.8, stagger: 0.07, ease: 'expo.out' })
        .fromTo('.clients__chapo', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.5')
        .fromTo(
          voie,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.5,
            onStart: () => {
              lancee = true;
              boucle.timeScale(ELAN * allure());
              if (visibilite.isActive) boucle.play();
              gsap.to(boucle, { timeScale: allure(), duration: 2.6, ease: 'power4.out', overwrite: true });
            },
          },
          '-=0.55'
        );
    }, sectionRef);

    return () => {
      ctx.revert();
      boucleRef.current = null;
    };
  }, []);

  const basculerPause = () => {
    pauseRef.current = !pauseRef.current;
    setEnPause(pauseRef.current);
    rejoindreAllure(pauseRef.current ? 0.5 : 0.9);
  };

  // Au survol à la souris, la bande freine jusqu'à l'arrêt pour qu'on puisse lire une plaque.
  const surEntree = (e) => {
    if (e.pointerType !== 'mouse') return;
    survolRef.current = true;
    rejoindreAllure(0.6);
  };
  const surSortie = (e) => {
    if (e.pointerType !== 'mouse') return;
    survolRef.current = false;
    rejoindreAllure(0.9);
  };

  return (
    <section className="clients" aria-labelledby="clients-titre" ref={sectionRef}>
      <header className="clients__tete">
        <h2 id="clients-titre" className="clients__titre">
          {TITRE.map(({ mot, accent }, i) => (
            <React.Fragment key={mot}>
              {i > 0 && ' '}
              <span className="mot">
                <span>{accent ? <em>{mot}</em> : mot}</span>
              </span>
            </React.Fragment>
          ))}
        </h2>
        <p className="clients__chapo">
          Des indépendants, des associations, des commerces et une enseigne nationale.
        </p>
      </header>

      <div className="clients__bande">
        <div className="clients__voie" ref={voieRef} onPointerEnter={surEntree} onPointerLeave={surSortie}>
          <div className="clients__piste" ref={pisteRef}>
            <ul className="clients__serie">
              <Serie prefixe="lue" />
            </ul>
            {/* Copies qui font boucler la bande : non lues par les lecteurs d'écran. */}
            <ul className="clients__serie clients__serie--copie" aria-hidden="true">
              {Array.from({ length: SERIES_PAR_MOITIE * 2 - 1 }, (_, i) => (
                <Serie key={i} prefixe={`copie-${i}`} />
              ))}
            </ul>
          </div>
        </div>
        <button
          type="button"
          className="clients__pause"
          onClick={basculerPause}
          aria-label={enPause ? 'Relancer le défilement des clients' : 'Mettre en pause le défilement des clients'}
        >
          {enPause ? <FaPlay aria-hidden="true" /> : <FaPause aria-hidden="true" />}
        </button>
      </div>
    </section>
  );
};

export default ClientsConfiance;
