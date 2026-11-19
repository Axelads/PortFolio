import React, { forwardRef, useRef, useState } from "react";
import ecransChoisis from "../../assets/Data/DataAppareils.json";

/**
 * Carte de projet présentée dans ses appareils (accueil > Mes projets) :
 *  - site web : la capture s'affiche sur l'écran d'un ordinateur portable ;
 *  - application mobile : une tablette et un téléphone côte à côte.
 * Les outils et scripts gardent la carte classique (Projects.js).
 *
 * Écrans : DataAppareils.json (captures recadrées au format de chaque écran,
 * dans public/images/appareils/<slug>/) ; sinon choix automatique parmi les
 * images PocketBase du projet, d'après le nom de fichier (« partage », « logo »,
 * « mobile », « tablette »…). Une app sans capture montre son icône, comme un
 * écran de démarrage.
 *
 * Motion : l'ordinateur, vu de trois quarts, arrive fermé en tournant puis ouvre
 * son capot (GSAP, animerOrdinateur ci-dessous, lancé par Projects.js) ;
 * tablette puis téléphone montent en décalé au défilement (CSS, _appareils.scss).
 * Au pointeur fin, l'ordinateur s'incline vers la souris et les deux
 * appareils mobiles se décalent en profondeur : ce composant ne fait qu'écrire
 * --px / --py (de -1 à 1) sur la carte, une fois par image au plus.
 */

const EXCLUS = /partage|logo|splash|icon|favicon|og[-_]/i;
const MOBILE = /mobile|telephone|phone/i;
const TABLETTE = /tablette|tablet|ipad/i;

const nomFichier = (url) => decodeURIComponent(String(url).split("?")[0].split("/").pop() || "");

export const TYPES_APPAREIL = {
  "site-web": "ordinateur",
  "application-mobile": "mobile",
};

const choisirEcrans = (projet, type) => {
  const urls = (projet.imageUrls || []).filter(Boolean);
  const choix = ecransChoisis[projet.slug] || {};

  if (type === "ordinateur") {
    const capture = urls.find((u) => !EXCLUS.test(nomFichier(u)) && !MOBILE.test(nomFichier(u)));
    return { ordinateur: choix.ordinateur || capture || urls[0] || null };
  }

  const tablettes = urls.filter((u) => TABLETTE.test(nomFichier(u)));
  const telephones = urls.filter((u) => !EXCLUS.test(nomFichier(u)) && !TABLETTE.test(nomFichier(u)));
  const telephone = choix.telephone || telephones[0] || null;
  return {
    telephone,
    tablette: choix.tablette || tablettes[0] || telephones[1] || telephone,
    telephonePaysage: choix.telephonePaysage,
    tablettePaysage: choix.tablettePaysage,
    // Aucune capture : l'icône de l'app, posée comme un écran de démarrage.
    icone: telephone ? null : urls[0] || null,
  };
};

// Pointeur fin seulement, et jamais sous prefers-reduced-motion.
const requetePointeur =
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)")
    : null;

/**
 * Écran d'un appareil. `paysage` vaut true / false quand le format est connu
 * (captures recadrées) ; sinon il se déduit de l'image une fois chargée.
 */
const Ecran = ({ src, icone, onFormat }) => (
  <>
    {src && (
      <img
        className="appareil__image"
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onLoad={
          onFormat
            ? (e) => onFormat(e.currentTarget.naturalWidth > e.currentTarget.naturalHeight)
            : undefined
        }
      />
    )}
    {!src && icone && (
      <span className="appareil__demarrage">
        <img src={icone} alt="" loading="lazy" decoding="async" />
      </span>
    )}
    <span className="appareil__veille" />
    <span className="appareil__reflet" />
  </>
);

/**
 * Ordinateur portable en vraie 3D, vu de trois quarts : un capot articulé sur un socle (clavier et pavé tactile).
 *  - .ordinateur : place et entrée (opacité) ; porte la perspective, hors de la chaîne 3D (une opacité < 1 aplatirait
 *    les appareils qu'elle contient) ;
 *  - __inclinaison : suit le pointeur (--px / --py) ;
 *  - __corps : l'orientation de trois quarts ;
 *  - __capot : tourne autour de la charnière, face écran d'un côté, dos en aluminium de l'autre (visible fermé).
 */
const Ordinateur = ({ src }) => (
  <div className="ordinateur">
    <div className="ordinateur__inclinaison">
      <div className="ordinateur__corps">
        <div className="ordinateur__socle">
          <span className="ordinateur__clavier" />
          <span className="ordinateur__pave" />
          {/* Épaisseur du socle : quatre tranches, visibles quand l'ordinateur tourne sur lui-même */}
          <span className="ordinateur__tranche ordinateur__tranche--avant" />
          <span className="ordinateur__tranche ordinateur__tranche--arriere" />
          <span className="ordinateur__tranche ordinateur__tranche--gauche" />
          <span className="ordinateur__tranche ordinateur__tranche--droite" />
        </div>
        <div className="ordinateur__capot">
          <div className="ordinateur__face">
            <div className="ordinateur__dalle">
              <Ecran src={src} />
            </div>
          </div>
          <div className="ordinateur__dos" />
        </div>
      </div>
    </div>
  </div>
);

/**
 * Entrée des ordinateurs (appelée par Projects.js quand le bloc « site web » arrive à l'écran, ou au choix du filtre) :
 * les cartes apparaissent l'une après l'autre ; chaque ordinateur arrive fermé en tournant sur lui-même, se pose de
 * trois quarts, puis ouvre son capot (léger rebond) et allume l'écran.
 * Pilote --tour et --capot (lus par le CSS) et l'opacité de l'écran éteint : rien d'autre que transform et opacity.
 * Renvoie la timeline GSAP ; Projects.js la nettoie avec son gsap.context.
 */
export const animerOrdinateur = (gsap, carte, decalage = 0) => {
  const corps = carte.querySelector(".ordinateur__corps");
  const veille = carte.querySelector(".ordinateur .appareil__veille");
  if (!corps) return null;
  return gsap
    .timeline({ delay: decalage })
    .fromTo(carte, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", clearProps: "transform,opacity" }, 0)
    .fromTo(corps, { "--tour": "-400deg", "--capot": "-90deg" }, { "--tour": "-32deg", duration: 1.35, ease: "power3.out" }, 0)
    .to(corps, { "--capot": "8deg", duration: 1.05, ease: "back.out(1.25)" }, 1.05)
    .fromTo(veille, { opacity: 1 }, { opacity: 0, duration: 0.5, ease: "power1.out" }, 1.6);
};

/** État de départ (fermé, invisible) posé avant l'arrivée à l'écran, pour qu'aucun ordinateur ouvert ne clignote. */
export const preparerOrdinateur = (gsap, carte) => {
  const corps = carte.querySelector(".ordinateur__corps");
  const veille = carte.querySelector(".ordinateur .appareil__veille");
  if (!corps) return;
  gsap.set(carte, { y: 36, opacity: 0 });
  gsap.set(corps, { "--tour": "-400deg", "--capot": "-90deg" });
  if (veille) gsap.set(veille, { opacity: 1 });
};

const DuoMobile = ({ ecrans }) => {
  // Format lu sur l'image quand DataAppareils.json ne le donne pas.
  const [telPaysage, setTelPaysage] = useState(false);
  const [tabPaysage, setTabPaysage] = useState(false);
  const tel = (ecrans.telephonePaysage ?? telPaysage) ? "paysage" : "portrait";
  // Une capture de téléphone recyclée dans la tablette reste en portrait.
  const tab = (ecrans.tablettePaysage ?? tabPaysage) ? "paysage" : "portrait";

  return (
    <div className="duo" data-tablette={tab} data-telephone={tel}>
      <div className="duo__tablette">
        <div className="tablette">
          <div className="tablette__ecran">
            <Ecran
              src={ecrans.tablette}
              icone={ecrans.icone}
              onFormat={ecrans.tablettePaysage === undefined ? setTabPaysage : undefined}
            />
          </div>
        </div>
      </div>
      <div className="duo__telephone">
        <div className="telephone">
          <div className="telephone__ecran">
            <Ecran
              src={ecrans.telephone}
              icone={ecrans.icone}
              onFormat={ecrans.telephonePaysage === undefined ? setTelPaysage : undefined}
            />
            <span className="telephone__ilot" />
          </div>
        </div>
      </div>
    </div>
  );
};

const CarteAppareil = forwardRef(({ project, type, children }, ref) => {
  const ecrans = choisirEcrans(project, type);
  const image = useRef(0);

  const suivre = (e) => {
    if (!requetePointeur?.matches) return;
    const carte = e.currentTarget;
    const { clientX, clientY } = e;
    cancelAnimationFrame(image.current);
    image.current = requestAnimationFrame(() => {
      const r = carte.getBoundingClientRect();
      const x = ((clientX - r.left) / r.width) * 2 - 1;
      const y = ((clientY - r.top) / r.height) * 2 - 1;
      carte.style.setProperty("--px", Math.max(-1, Math.min(1, x)).toFixed(3));
      carte.style.setProperty("--py", Math.max(-1, Math.min(1, y)).toFixed(3));
    });
  };

  const relacher = (e) => {
    cancelAnimationFrame(image.current);
    e.currentTarget.style.removeProperty("--px");
    e.currentTarget.style.removeProperty("--py");
  };

  return (
    <a
      ref={ref}
      className={`project-card projet-appareil projet-appareil--${type} ${
        project.completed ? "completed" : "in-progress"
      }`}
      href={`/Projet/${project.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Voir le projet ${project.name}`}
      onPointerMove={suivre}
      onPointerLeave={relacher}
    >
      <div className="projet-appareil__scene">
        {type === "ordinateur" ? <Ordinateur src={ecrans.ordinateur} /> : <DuoMobile ecrans={ecrans} />}
      </div>
      {children}
    </a>
  );
});

CarteAppareil.displayName = "CarteAppareil";

export default CarteAppareil;
