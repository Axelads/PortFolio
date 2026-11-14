import React, { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Vitrine d'un projet : quelques éléments réels du site présenté (produits
 * d'une boutique…), chacun lien direct vers sa page sur le site en ligne.
 * Données dans src/assets/Data/DataVitrines.json, indexées par slug de projet.
 *
 * Motion (GSAP + ScrollTrigger, pattern maison — transform/opacity seulement) :
 *  - entrée quand la section arrive à l'écran : titre révélé mot par mot
 *    (masque + translateY), puis cartes en stagger 60 ms, photo qui se pose ;
 *  - parallaxe de chaque photo dans sa fenêtre au défilement (pointeur fin) ;
 *  - survol en CSS : carte qui s'élève, photo qui avance, flèche qui part.
 * Tout est coupé sous prefers-reduced-motion (garde JS + CSS).
 */

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const REQUETE_FIN = "(hover: hover) and (pointer: fine) and (min-width: 769px)";
const ECHELLE_REPOS = 1.08; // marge pour la parallaxe verticale

const Fleche = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path
      d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const VitrineProjet = ({ vitrine }) => {
  const racineRef = useRef(null);
  const produits = vitrine?.produits || [];
  const mots = (vitrine?.titre || "").split(/\s+/).filter(Boolean);

  useLayoutEffect(() => {
    const racine = racineRef.current;
    if (!racine || !produits.length || prefersReducedMotion()) return undefined;

    const mm = gsap.matchMedia();
    mm.add({ base: "all", fin: REQUETE_FIN }, (contexte) => {
      const { fin } = contexte.conditions;
      const q = gsap.utils.selector(racine);
      const cartes = q(".vitrine-projet__item");
      const calques = q(".vitrine-projet__calque");
      const repos = fin ? ECHELLE_REPOS : 1;

      racine.classList.add("est-animee");
      gsap
        .timeline({
          defaults: { ease: "expo.out" },
          scrollTrigger: { trigger: racine, start: "top 82%", once: true },
          onComplete: () => racine.classList.remove("est-animee"),
        })
        .fromTo(q(".vitrine-projet__libelle"), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0)
        .fromTo(q(".vitrine-projet__mot > span"), { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.06 }, 0.05)
        .fromTo(q(".vitrine-projet__intro"), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 0.3)
        .fromTo(
          cartes,
          { y: 70, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.2, stagger: 0.06, clearProps: "transform,opacity" },
          0.35
        )
        .fromTo(calques, { scale: 1.28 }, { scale: repos, duration: 1.6, stagger: 0.06 }, 0.35)
        .fromTo(q(".vitrine-projet__tout"), { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, clearProps: "transform,opacity" }, 0.8);

      if (fin) {
        // Chaque photo glisse dans sa fenêtre pendant le défilement de la page.
        cartes.forEach((carte, i) => {
          gsap.fromTo(
            calques[i],
            { yPercent: -3 },
            {
              yPercent: 3,
              ease: "none",
              scrollTrigger: { trigger: carte, start: "top bottom", end: "bottom top", scrub: 0.6 },
            }
          );
        });
      }
    });

    return () => {
      mm.revert();
      racine.classList.remove("est-animee");
    };
  }, [produits.length]);

  if (!produits.length) return null;

  return (
    <section className="vitrine-projet" aria-labelledby="vitrine-projet-titre" ref={racineRef}>
      <div className="vitrine-projet__entete">
        {vitrine.libelle && <p className="vitrine-projet__libelle">{vitrine.libelle}</p>}
        <h2 id="vitrine-projet-titre" className="vitrine-projet__titre" aria-label={vitrine.titre}>
          {mots.map((mot, i) => (
            // L'espace reste hors du masque : en fin d'inline-block, il serait avalé.
            <React.Fragment key={`${mot}-${i}`}>
              <span className="vitrine-projet__mot" aria-hidden="true">
                <span>{mot}</span>
              </span>
              {i < mots.length - 1 ? " " : null}
            </React.Fragment>
          ))}
        </h2>
        {vitrine.intro && <p className="vitrine-projet__intro">{vitrine.intro}</p>}
      </div>

      <ul className="vitrine-projet__grille">
        {produits.map((produit) => (
          <li className="vitrine-projet__item" key={produit.url}>
            <a className="vitrine-projet__carte" href={produit.url} target="_blank" rel="noopener noreferrer">
              <span className="vitrine-projet__fenetre">
                <span className="vitrine-projet__calque">
                  <img
                    className="vitrine-projet__image"
                    src={produit.image}
                    alt=""
                    width="640"
                    height="640"
                    loading="lazy"
                    decoding="async"
                  />
                </span>
              </span>
              <span className="vitrine-projet__texte">
                {produit.rayon && <span className="vitrine-projet__rayon">{produit.rayon}</span>}
                <span className="vitrine-projet__nom">{produit.nom}</span>
                <span className="vitrine-projet__action">
                  Voir sur la{" "}
                  {/* flèche soudée au dernier mot : sur carte étroite, la ligne se coupe avant « boutique » */}
                  <span className="vitrine-projet__insecable">
                    boutique
                    <span className="vitrine-projet__fleche">
                      <Fleche />
                    </span>
                  </span>
                  <span className="vitrine-projet__cache"> (nouvel onglet)</span>
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      {vitrine.lienTout?.url && (
        <a className="vitrine-projet__tout" href={vitrine.lienTout.url} target="_blank" rel="noopener noreferrer">
          {vitrine.lienTout.libelle}
          <span className="vitrine-projet__fleche">
            <Fleche />
          </span>
          <span className="vitrine-projet__cache"> (nouvel onglet)</span>
        </a>
      )}
    </section>
  );
};

export default VitrineProjet;
