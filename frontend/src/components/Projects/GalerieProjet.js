import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Galerie des captures d'un projet : une seule rangée horizontale (pellicule),
 * défilement natif avec accroche, flèches, compteur, barre de progression et
 * visionneuse plein écran qui s'ouvre depuis la vignette cliquée.
 *
 * Entièrement pilotée par les données PocketBase : 1 à 12 images, portrait ou
 * paysage, n'importe quelle URL. Les flèches et la progression n'apparaissent
 * que si la rangée déborde.
 *
 * Motion (GSAP + ScrollTrigger, pattern maison — transform/opacity seulement) :
 *  - entrée orchestrée quand la rangée arrive à l'écran (glissement + zoom qui
 *    se pose, stagger 70 ms) ;
 *  - parallaxe dans chaque fenêtre pendant le défilement horizontal, et dérive
 *    de la rangée liée au défilement vertical de la page (pointeur fin) ;
 *  - visionneuse : l'image s'étend depuis sa vignette (FLIP) et y revient.
 * Tout est coupé sous prefers-reduced-motion (garde JS + CSS).
 */

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const pointeurFin = () =>
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const REQUETE_FIN = "(hover: hover) and (pointer: fine) and (min-width: 769px)";
const ECHELLE_REPOS = 1.06; // marge de 3 % de chaque côté pour la parallaxe
const DELAI_REFRESH = 200;
const SEUIL_GLISSEMENT = 6;

const deuxChiffres = (n) => String(n).padStart(2, "0");

// Défilement immédiat quoi que dise le CSS (`scroll-behavior: smooth` sur la
// piste) : `behavior: "instant"` l'emporte, là où une simple affectation de
// scrollLeft suit le CSS et traîne derrière le pointeur.
const defilerInstantanement = (piste, left) => {
  if (typeof piste.scrollTo === "function") {
    piste.scrollTo({ left, behavior: "instant" });
  } else {
    piste.scrollLeft = left;
  }
};

const margeDeLecture = (rangee) =>
  rangee ? parseFloat(getComputedStyle(rangee).paddingInlineStart) || 0 : 0;

// Position de défilement qui aligne `cadre` sur le bord de lecture.
const positionDuCadre = (piste, cadre, marge) => {
  const max = piste.scrollWidth - piste.clientWidth;
  return Math.min(max, Math.max(0, cadre.offsetLeft - marge));
};

const verrouillerDefilement = (actif) => {
  const html = document.documentElement;
  if (actif) {
    const barre = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    document.body.style.paddingRight = barre > 0 ? `${barre}px` : "";
  } else {
    html.style.overflow = "";
    document.body.style.paddingRight = "";
  }
};

// Taille de l'image agrandie : la plus grande possible dans la fenêtre, en
// laissant la place des commandes en haut et en bas.
const dimensionsAjustees = (naturelleL, naturelleH) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const largeurMax = vw - Math.max(32, vw * 0.08);
  const hauteurMax = vh - Math.max(120, vh * 0.16);
  const ratio = naturelleL / naturelleH || 1;
  let w = largeurMax;
  let h = w / ratio;
  if (h > hauteurMax) {
    h = hauteurMax;
    w = h * ratio;
  }
  return { w, h, left: (vw - w) / 2, top: (vh - h) / 2 - 8 };
};

const Chevron = ({ sens }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d={sens < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Croix = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M6 6l12 12M18 6L6 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const Agrandir = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const GalerieProjet = ({ images, nom }) => {
  const urls = useMemo(
    () =>
      (Array.isArray(images) ? images : []).filter(
        (url) => typeof url === "string" && url.trim() !== ""
      ),
    [images]
  );
  const total = urls.length;

  const racineRef = useRef(null);
  const enteteRef = useRef(null);
  const pisteRef = useRef(null);
  const rangeeRef = useRef(null);
  const progressionRef = useRef(null);
  const cadresRef = useRef([]);
  const fenetresRef = useRef([]);
  const imagesRef = useRef([]);
  const dialogueRef = useRef(null);
  const grandeRef = useRef(null);
  const fondRef = useRef(null);
  const fermerRef = useRef(null);
  const piedRef = useRef(null);
  const transitionRef = useRef({ type: "ouverture", sens: 1 });
  const occupeRef = useRef(false); // ouverture, navigation ou fermeture en cours
  const entreeJoueeRef = useRef(false);

  const [chargees, setChargees] = useState(() => new Set());
  const [etat, setEtat] = useState({
    courant: 0,
    deborde: false,
    auDebut: true,
    aLaFin: true,
  });
  const [visionneuse, setVisionneuse] = useState(null);

  cadresRef.current.length = total;
  fenetresRef.current.length = total;
  imagesRef.current.length = total;

  const marquerChargee = useCallback((i) => {
    setChargees((prev) => {
      if (prev.has(i)) return prev;
      const suivant = new Set(prev);
      suivant.add(i);
      return suivant;
    });
  }, []);

  // Images déjà en cache : `load` a pu partir avant le montage du gestionnaire.
  useEffect(() => {
    const deja = new Set();
    imagesRef.current.forEach((img, i) => {
      if (img && img.complete && img.naturalWidth > 0) deja.add(i);
    });
    setChargees(deja);
  }, [urls]);

  // Compteur, flèches et barre de progression suivent la position de la piste.
  const mettreAJour = useCallback(() => {
    const piste = pisteRef.current;
    if (!piste) return;
    const max = piste.scrollWidth - piste.clientWidth;
    const deborde = max > 4;
    const progression = deborde
      ? Math.min(1, Math.max(0, piste.scrollLeft / max))
      : 0;
    if (progressionRef.current) {
      progressionRef.current.style.transform = `scaleX(${progression})`;
    }

    // Cadre courant : celui dont le bord gauche est le plus proche du bord de
    // lecture (le début de la colonne de contenu).
    const repere = piste.scrollLeft + margeDeLecture(rangeeRef.current);
    let courant = 0;
    let distance = Infinity;
    cadresRef.current.forEach((cadre, i) => {
      if (!cadre) return;
      const d = Math.abs(cadre.offsetLeft - repere);
      if (d < distance) {
        distance = d;
        courant = i;
      }
    });
    // Les flèches se désactivent aux butées réelles de la piste, pas sur le
    // numéro du cadre : avec peu de débordement, le dernier cadre n'atteint
    // jamais le bord de lecture.
    const auDebut = piste.scrollLeft <= 4;
    const aLaFin = !deborde || max - piste.scrollLeft <= 4;

    setEtat((prev) =>
      prev.courant === courant &&
      prev.deborde === deborde &&
      prev.auDebut === auDebut &&
      prev.aLaFin === aLaFin
        ? prev
        : { courant, deborde, auDebut, aLaFin }
    );
  }, []);

  useEffect(() => {
    const piste = pisteRef.current;
    if (!piste) return undefined;
    let image = 0;
    let minuterie = 0;
    const planifier = () => {
      if (image) return;
      image = requestAnimationFrame(() => {
        image = 0;
        mettreAJour();
      });
    };
    // Une image qui se charge change la largeur de son cadre : les positions
    // des déclencheurs horizontaux sont à recalculer.
    const surRedimension = () => {
      planifier();
      window.clearTimeout(minuterie);
      minuterie = window.setTimeout(() => ScrollTrigger.refresh(), DELAI_REFRESH);
    };
    piste.addEventListener("scroll", planifier, { passive: true });
    const observateur = new ResizeObserver(surRedimension);
    observateur.observe(piste);
    cadresRef.current.forEach((cadre) => cadre && observateur.observe(cadre));
    mettreAJour();
    return () => {
      piste.removeEventListener("scroll", planifier);
      observateur.disconnect();
      if (image) cancelAnimationFrame(image);
      window.clearTimeout(minuterie);
    };
  }, [mettreAJour]);

  const defilerVers = useCallback((index, instantane = false) => {
    const piste = pisteRef.current;
    const cadre = cadresRef.current[index];
    if (!piste || !cadre) return;
    const left = positionDuCadre(piste, cadre, margeDeLecture(rangeeRef.current));
    if (instantane || prefersReducedMotion()) {
      defilerInstantanement(piste, left); // toujours une position d'accroche
    } else {
      piste.scrollTo({ left, behavior: "smooth" });
    }
  }, []);

  const defilerDe = (sens) => {
    const cible = Math.min(total - 1, Math.max(0, etat.courant + sens));
    if (cible !== etat.courant) defilerVers(cible);
  };

  const surClavierPiste = (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      defilerDe(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      defilerDe(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      defilerVers(0);
    } else if (e.key === "End") {
      e.preventDefault();
      defilerVers(total - 1);
    }
  };

  // Glisser à la souris (pointeur fin) : l'accroche est suspendue pendant le
  // geste, puis la piste se pose sur le cadre le plus proche de la projection
  // de la vitesse. Le clic qui suit un glissement est avalé.
  useEffect(() => {
    const piste = pisteRef.current;
    if (!piste || !pointeurFin()) return undefined;
    let actif = false;
    let deplace = false;
    let departX = 0;
    let departScroll = 0;
    let dernierX = 0;
    let dernierT = 0;
    let vitesse = 0;
    let tween = null;

    const surAppui = (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if (tween) {
        tween.kill();
        tween = null;
        piste.classList.remove("est-saisie");
      }
      actif = true;
      deplace = false;
      departX = e.clientX;
      departScroll = piste.scrollLeft;
      dernierX = e.clientX;
      dernierT = e.timeStamp;
      vitesse = 0;
    };

    const surMouvement = (e) => {
      if (!actif) return;
      const dx = e.clientX - departX;
      if (!deplace) {
        if (Math.abs(dx) < SEUIL_GLISSEMENT) return;
        deplace = true;
        piste.classList.add("est-saisie");
        try {
          piste.setPointerCapture(e.pointerId);
        } catch (erreur) {
          // capture refusée : le glissement continue via window
        }
      }
      defilerInstantanement(piste, departScroll - dx);
      const dt = e.timeStamp - dernierT;
      if (dt > 0) vitesse = (e.clientX - dernierX) / dt;
      dernierX = e.clientX;
      dernierT = e.timeStamp;
    };

    const surRelache = () => {
      if (!actif) return;
      actif = false;
      if (!deplace) return;
      const max = piste.scrollWidth - piste.clientWidth;
      const marge = margeDeLecture(rangeeRef.current);
      const projection = Math.min(
        max,
        Math.max(0, piste.scrollLeft - vitesse * 160)
      );
      let cible = projection;
      let distance = Infinity;
      cadresRef.current.forEach((cadre) => {
        if (!cadre) return;
        const debut = positionDuCadre(piste, cadre, marge);
        const d = Math.abs(debut - projection);
        if (d < distance) {
          distance = d;
          cible = debut;
        }
      });
      if (prefersReducedMotion()) {
        defilerInstantanement(piste, cible);
        piste.classList.remove("est-saisie");
        return;
      }
      const defilement = { v: piste.scrollLeft };
      tween = gsap.to(defilement, {
        v: cible,
        duration: 0.7,
        ease: "power3.out",
        onUpdate: () => {
          defilerInstantanement(piste, defilement.v);
        },
        onComplete: () => {
          tween = null;
          piste.classList.remove("est-saisie");
        },
      });
    };

    const surClic = (e) => {
      if (!deplace) return;
      e.preventDefault();
      e.stopPropagation();
      deplace = false;
    };

    piste.addEventListener("pointerdown", surAppui);
    window.addEventListener("pointermove", surMouvement);
    window.addEventListener("pointerup", surRelache);
    window.addEventListener("pointercancel", surRelache);
    piste.addEventListener("click", surClic, true);
    return () => {
      piste.removeEventListener("pointerdown", surAppui);
      window.removeEventListener("pointermove", surMouvement);
      window.removeEventListener("pointerup", surRelache);
      window.removeEventListener("pointercancel", surRelache);
      piste.removeEventListener("click", surClic, true);
      if (tween) tween.kill();
      piste.classList.remove("est-saisie");
    };
  }, []);

  // Entrée orchestrée + parallaxe (GSAP). Garde JS obligatoire : sous
  // reduced-motion rien n'est posé, le contenu est visible par défaut en CSS.
  useEffect(() => {
    if (!total || prefersReducedMotion()) return undefined;
    const racine = racineRef.current;
    const piste = pisteRef.current;
    const rangee = rangeeRef.current;
    if (!racine || !piste || !rangee) return undefined;

    const mm = gsap.matchMedia();
    mm.add({ base: "all", fin: REQUETE_FIN }, (contexte) => {
      const { fin } = contexte.conditions;
      const cadres = [];
      const visuels = [];
      cadresRef.current.forEach((cadre, i) => {
        const visuel = imagesRef.current[i];
        if (cadre && visuel) {
          cadres.push(cadre);
          visuels.push(visuel);
        }
      });
      const repos = fin ? ECHELLE_REPOS : 1;

      if (!entreeJoueeRef.current) {
        // Pendant l'entrée, les transitions CSS de survol sont coupées pour
        // ne pas lisser les valeurs posées image par image par GSAP.
        racine.classList.add("est-animee");
        const entree = gsap.timeline({
          defaults: { ease: "expo.out" },
          scrollTrigger: { trigger: racine, start: "top 85%", once: true },
          onStart: () => {
            entreeJoueeRef.current = true;
          },
          onComplete: () => racine.classList.remove("est-animee"),
        });
        entree
          .fromTo(
            enteteRef.current,
            { y: 14, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.9 },
            0
          )
          .fromTo(
            cadres,
            { x: 140, opacity: 0, scale: 0.9 },
            {
              x: 0,
              opacity: 1,
              scale: 1,
              duration: 1.2,
              stagger: 0.07,
              clearProps: "transform,opacity",
            },
            0.05
          )
          .fromTo(
            visuels,
            { scale: 1.3 },
            { scale: repos, duration: 1.7, stagger: 0.07 },
            0.05
          )
          .fromTo(
            progressionRef.current?.parentElement,
            { opacity: 0 },
            { opacity: 1, duration: 0.6, clearProps: "opacity" },
            0.5
          );
      } else {
        gsap.set(visuels, { scale: repos });
      }

      if (fin) {
        // Chaque image glisse dans sa fenêtre pendant le défilement horizontal.
        cadres.forEach((cadre, i) => {
          gsap.fromTo(
            visuels[i],
            { xPercent: -3 },
            {
              xPercent: 3,
              ease: "none",
              scrollTrigger: {
                scroller: piste,
                horizontal: true,
                trigger: cadre,
                start: "left right",
                end: "right left",
                scrub: 0.5,
              },
            }
          );
        });
        // La rangée dérive avec le défilement vertical de la page (x = 0 au
        // moment où elle est au centre de la fenêtre).
        gsap.fromTo(
          rangee,
          { x: 30 },
          {
            x: -30,
            ease: "none",
            scrollTrigger: {
              trigger: racine,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.8,
            },
          }
        );
      }
    });

    return () => {
      mm.revert();
      racine.classList.remove("est-animee");
    };
  }, [total]);

  // ----- Visionneuse -----

  const ouvrir = useCallback(
    (i) => {
      if (occupeRef.current) return;
      occupeRef.current = true;
      transitionRef.current = { type: "ouverture", sens: 1 };
      [i - 1, i + 1].forEach((j) => {
        if (urls[j]) {
          const precharge = new Image();
          precharge.src = urls[j];
        }
      });
      setVisionneuse(i);
    },
    [urls]
  );

  const fermer = useCallback(() => {
    const dialogue = dialogueRef.current;
    const grande = grandeRef.current;
    if (visionneuse === null || !dialogue || occupeRef.current) return;
    occupeRef.current = true;

    const fin = () => {
      occupeRef.current = false;
      if (dialogue.open) dialogue.close();
      verrouillerDefilement(false);
      setVisionneuse(null);
    };

    if (prefersReducedMotion() || !grande) {
      fin();
      return;
    }

    const fenetre = fenetresRef.current[visionneuse];
    const r = fenetre ? fenetre.getBoundingClientRect() : null;
    const left = parseFloat(grande.style.left) || 0;
    const top = parseFloat(grande.style.top) || 0;
    const w = parseFloat(grande.style.width) || 1;
    const h = parseFloat(grande.style.height) || 1;
    const retour = r
      ? {
          x: r.left - left,
          y: r.top - top,
          scaleX: r.width / w,
          scaleY: r.height / h,
          duration: 0.5,
          ease: "power3.inOut",
        }
      : { opacity: 0, scale: 0.92, duration: 0.3, ease: "power2.in" };

    gsap
      .timeline({ onComplete: fin })
      .to(
        [fermerRef.current, piedRef.current],
        { opacity: 0, y: 6, duration: 0.2, ease: "power2.in" },
        0
      )
      .to(grande, retour, 0)
      .to(
        fondRef.current,
        { opacity: 0, duration: 0.4, ease: "power2.inOut" },
        0.1
      );
  }, [visionneuse]);

  const naviguer = useCallback(
    (sens) => {
      if (visionneuse === null || total < 2 || occupeRef.current) return;
      occupeRef.current = true;
      const cible = (visionneuse + sens + total) % total;
      transitionRef.current = { type: "navigation", sens };
      const precharge = new Image();
      precharge.src = urls[(cible + sens + total) % total];
      // La piste suit sous le voile : à la fermeture, l'image revient sur une
      // vignette visible.
      defilerVers(cible, true);
      if (prefersReducedMotion() || !grandeRef.current) {
        setVisionneuse(cible);
        return;
      }
      gsap.to(grandeRef.current, {
        opacity: 0,
        x: -sens * 48,
        duration: 0.22,
        ease: "power2.in",
        onComplete: () => setVisionneuse(cible),
      });
    },
    [visionneuse, total, urls, defilerVers]
  );

  // Ouverture (FLIP depuis la vignette) et arrivée d'une nouvelle image.
  useLayoutEffect(() => {
    const dialogue = dialogueRef.current;
    const grande = grandeRef.current;
    if (visionneuse === null || !dialogue || !grande) return undefined;
    const { type, sens } = transitionRef.current;
    const reduit = prefersReducedMotion();

    if (!dialogue.open) {
      verrouillerDefilement(true);
      dialogue.showModal();
    }

    let annule = false;
    const placer = () => {
      const d = dimensionsAjustees(grande.naturalWidth, grande.naturalHeight);
      grande.style.width = `${d.w}px`;
      grande.style.height = `${d.h}px`;
      grande.style.left = `${d.left}px`;
      grande.style.top = `${d.top}px`;
      return d;
    };

    const lancer = () => {
      if (annule) return;
      const d = placer();
      const commandes = [fermerRef.current, piedRef.current];

      if (reduit) {
        gsap.set(grande, { clearProps: "transform", opacity: 1 });
        gsap.set([fondRef.current, ...commandes], { opacity: 1 });
        occupeRef.current = false;
        return;
      }

      if (type === "ouverture") {
        const fenetre = fenetresRef.current[visionneuse];
        const r = fenetre ? fenetre.getBoundingClientRect() : null;
        const depuis = r
          ? {
              x: r.left - d.left,
              y: r.top - d.top,
              scaleX: r.width / d.w,
              scaleY: r.height / d.h,
              opacity: 1,
            }
          : { opacity: 0, scale: 0.92 };
        gsap
          .timeline({
            onComplete: () => {
              occupeRef.current = false;
            },
          })
          .fromTo(
            fondRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.45, ease: "power2.out" },
            0
          )
          .fromTo(
            grande,
            depuis,
            {
              x: 0,
              y: 0,
              scaleX: 1,
              scaleY: 1,
              opacity: 1,
              duration: 0.7,
              ease: "expo.out",
            },
            0
          )
          .fromTo(
            commandes,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.05 },
            0.25
          );
      } else {
        gsap.fromTo(
          grande,
          { opacity: 0, x: sens * 48, y: 0, scaleX: 1, scaleY: 1 },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            ease: "power3.out",
            onComplete: () => {
              occupeRef.current = false;
            },
          }
        );
      }
    };

    if (grande.complete && grande.naturalWidth > 0) {
      lancer();
    } else {
      grande.addEventListener("load", lancer, { once: true });
    }

    const surRedimension = () => {
      if (!annule && grande.naturalWidth > 0) placer();
    };
    window.addEventListener("resize", surRedimension);

    return () => {
      annule = true;
      grande.removeEventListener("load", lancer);
      window.removeEventListener("resize", surRedimension);
    };
  }, [visionneuse]);

  // Fermeture par le navigateur (Échap forcé, etc.) : on resynchronise l'état.
  const surFermetureNative = () => {
    if (visionneuse === null) return;
    occupeRef.current = false;
    verrouillerDefilement(false);
    setVisionneuse(null);
  };

  const surClavierVisionneuse = (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      naviguer(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      naviguer(-1);
    }
  };

  useEffect(() => () => verrouillerDefilement(false), []);

  if (!total) return null;

  const { courant, deborde, auDebut, aLaFin } = etat;
  const ouvert = visionneuse !== null;

  return (
    <section
      className="galerie-projet"
      ref={racineRef}
      aria-label={`Captures du projet ${nom}`}
    >
      <div className="galerie-projet__entete" ref={enteteRef}>
        <p className="galerie-projet__libelle">
          <span>Captures</span>
          {total > 1 && (
            <span
              className="galerie-projet__compteur"
              aria-live="polite"
              aria-atomic="true"
            >
              <span className="galerie-projet__chiffre">
                <span key={courant}>{deuxChiffres(courant + 1)}</span>
              </span>
              <span className="galerie-projet__separateur" aria-hidden="true">
                /
              </span>
              <span>{deuxChiffres(total)}</span>
            </span>
          )}
        </p>
        <div className="galerie-projet__fleches" hidden={!deborde}>
          <button
            type="button"
            className="galerie-projet__fleche galerie-projet__fleche--prec"
            onClick={() => defilerDe(-1)}
            disabled={auDebut}
            aria-label="Capture précédente"
          >
            <Chevron sens={-1} />
          </button>
          <button
            type="button"
            className="galerie-projet__fleche galerie-projet__fleche--suiv"
            onClick={() => defilerDe(1)}
            disabled={aLaFin}
            aria-label="Capture suivante"
          >
            <Chevron sens={1} />
          </button>
        </div>
      </div>

      <div
        className="galerie-projet__piste"
        ref={pisteRef}
        tabIndex={0}
        role="region"
        aria-roledescription="carrousel"
        aria-label="Faites défiler les captures"
        onKeyDown={surClavierPiste}
      >
        <ul className="galerie-projet__rangee" ref={rangeeRef}>
          {urls.map((url, i) => (
            <li
              className={`galerie-projet__cadre${chargees.has(i) ? " est-chargee" : ""}`}
              key={`${i}-${url}`}
              ref={(el) => {
                cadresRef.current[i] = el;
              }}
            >
              <button
                type="button"
                className="galerie-projet__bouton"
                onClick={() => ouvrir(i)}
                aria-label={`Agrandir la capture ${i + 1} sur ${total}`}
              >
                <span
                  className="galerie-projet__fenetre"
                  ref={(el) => {
                    fenetresRef.current[i] = el;
                  }}
                >
                  <span className="galerie-projet__calque">
                    <img
                      ref={(el) => {
                        imagesRef.current[i] = el;
                      }}
                      className="galerie-projet__image"
                      src={url}
                      alt={`${nom} – capture ${i + 1} sur ${total}`}
                      loading={i < 2 ? "eager" : "lazy"}
                      decoding="async"
                      draggable={false}
                      onLoad={() => marquerChargee(i)}
                    />
                  </span>
                  <span className="galerie-projet__loupe" aria-hidden="true">
                    <Agrandir />
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div
        className={`galerie-projet__progression${deborde ? "" : " est-inactive"}`}
        aria-hidden="true"
      >
        <span ref={progressionRef} />
      </div>

      <dialog
        ref={dialogueRef}
        className="galerie-projet__visionneuse"
        aria-label={`${nom} – capture agrandie`}
        onCancel={(e) => {
          e.preventDefault();
          fermer();
        }}
        onClose={surFermetureNative}
        onKeyDown={surClavierVisionneuse}
        onClick={(e) => {
          if (e.target === e.currentTarget || e.target === fondRef.current) {
            fermer();
          }
        }}
      >
        {ouvert && (
          <>
            <div className="galerie-projet__fond" ref={fondRef} />
            <img
              ref={grandeRef}
              className="galerie-projet__grande"
              src={urls[visionneuse]}
              alt={`${nom} – capture ${visionneuse + 1} sur ${total}`}
              draggable={false}
            />
            <button
              type="button"
              className="galerie-projet__fermer"
              ref={fermerRef}
              onClick={fermer}
              aria-label="Fermer la visionneuse"
            >
              <Croix />
            </button>
            <div className="galerie-projet__pied" ref={piedRef}>
              {total > 1 && (
                <button
                  type="button"
                  className="galerie-projet__nav"
                  onClick={() => naviguer(-1)}
                  aria-label="Capture précédente"
                >
                  <Chevron sens={-1} />
                </button>
              )}
              <p className="galerie-projet__legende">
                <span className="galerie-projet__compteur">
                  {deuxChiffres(visionneuse + 1)}
                  <span className="galerie-projet__separateur" aria-hidden="true">
                    /
                  </span>
                  {deuxChiffres(total)}
                </span>
                <span className="galerie-projet__nom">{nom}</span>
              </p>
              {total > 1 && (
                <button
                  type="button"
                  className="galerie-projet__nav"
                  onClick={() => naviguer(1)}
                  aria-label="Capture suivante"
                >
                  <Chevron sens={1} />
                </button>
              )}
            </div>
          </>
        )}
      </dialog>
    </section>
  );
};

export default GalerieProjet;
