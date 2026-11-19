import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import instantane from '../../assets/Data/DataNoteGoogle.json';
import { URL_API_TABLEAU_DE_BORD } from '../../pages/TableauDeBord/constantes';

// Note de la fiche Google d'Axel, sous « Freelance — Rougiers… » dans le portrait.
// - Visible à partir de 5 avis seulement (choix d'Axel) : avant, le composant ne rend rien.
// - Premier rendu sans réseau : instantané écrit au build (scripts/note-google.mjs) ou dernier relevé gardé par ce
//   navigateur, le plus récent des deux. Le bloc est donc là dès l'ouverture et ne décale pas la page. L'API
//   (qui ne lit Google qu'une fois par 24 h) le met ensuite à jour.
// - Un lien vers les avis sur Google : le visiteur peut vérifier qu'ils sont vrais.

const SEUIL_AVIS = 5;
const CLE_MEMOIRE = 'note-google';
const ID_ETOILE = 'note-google-etoile';

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Garde un relevé seulement s'il a la forme attendue (la mémoire locale peut contenir n'importe quoi). */
function valide(avis) {
  if (!avis || !Number.isInteger(avis.nombre) || avis.nombre < 0) return null;
  const note = typeof avis.note === 'number' && avis.note >= 1 && avis.note <= 5 ? avis.note : null;
  const lien = typeof avis.lien === 'string' && avis.lien.startsWith('https://search.google.com/local/reviews?') ? avis.lien : null;
  const releveLe = typeof avis.releveLe === 'string' ? avis.releveLe : null;
  return { note, nombre: avis.nombre, lien, releveLe };
}

function lireMemoire() {
  try {
    return valide(JSON.parse(window.localStorage.getItem(CLE_MEMOIRE)));
  } catch {
    return null;
  }
}

/** Le relevé le plus récent entre l'instantané du build et la mémoire du navigateur. */
function plusRecent(a, b) {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(b.releveLe || 0) > Date.parse(a.releveLe || 0) ? b : a;
}

const formaterNote = (note) => note.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const Etoiles = () =>
  Array.from({ length: 5 }, (_, i) => (
    <svg key={i} className="note-google__etoile" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <use href={`#${ID_ETOILE}`} />
    </svg>
  ));

const NoteGoogle = () => {
  const [avis, setAvis] = useState(() => plusRecent(valide(instantane), lireMemoire()));
  const lienRef = useRef(null);
  const pleinRef = useRef(null);
  const dejaAnime = useRef(false);

  // Rafraîchit auprès de l'API ; en cas d'échec, le relevé affiché reste celui du build ou de la mémoire.
  useEffect(() => {
    const controleur = new AbortController();
    fetch(`${URL_API_TABLEAU_DE_BORD}/avis-google`, { signal: controleur.signal, credentials: 'omit' })
      .then((r) => (r.ok ? r.json() : null))
      .then((reponse) => {
        const frais = reponse?.branche ? valide(reponse) : null;
        if (!frais || frais.releveLe === null) return;
        setAvis((actuel) => plusRecent(actuel, frais));
        try {
          window.localStorage.setItem(CLE_MEMOIRE, JSON.stringify(frais));
        } catch {
          // Mémoire locale indisponible (navigation privée…) : l'instantané du build suffit.
        }
      })
      .catch(() => {});
    return () => controleur.abort();
  }, []);

  const visible = Boolean(avis && avis.note && avis.lien && avis.nombre >= SEUIL_AVIS);
  const vide = visible ? 100 - (avis.note / 5) * 100 : 100;

  // Entrée : le bloc monte après le portrait, puis les étoiles se remplissent jusqu'à la note. Une seule fois.
  useEffect(() => {
    if (!visible || dejaAnime.current || prefersReducedMotion()) return undefined;
    dejaAnime.current = true;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ delay: 0.9 })
        .fromTo(lienRef.current, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', clearProps: 'transform,opacity' })
        .fromTo(
          pleinRef.current,
          { clipPath: 'inset(0% 100% 0% 0%)' },
          { clipPath: `inset(0% ${vide}% 0% 0%)`, duration: 0.9, ease: 'power2.out' },
          '-=0.25',
        );
    });
    return () => ctx.revert();
  }, [visible, vide]);

  if (!visible) return null;

  const note = formaterNote(avis.note);
  return (
    <a
      ref={lienRef}
      className="note-google"
      href={avis.lien}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Note Google : ${note} sur 5, ${avis.nombre} avis. Voir les avis sur Google (nouvel onglet)`}
    >
      {/* Forme de l'étoile, déclarée une fois et reprise par <use> (rien à télécharger). */}
      <svg className="note-google__symboles" aria-hidden="true" focusable="false">
        <symbol id={ID_ETOILE} viewBox="0 0 24 24">
          <path d="M12 2.4l2.95 5.98 6.6.96-4.78 4.65 1.13 6.57L12 17.46l-5.9 3.1 1.13-6.57-4.78-4.65 6.6-.96z" />
        </symbol>
      </svg>
      <span className="note-google__valeur">{note}</span>
      <span className="note-google__etoiles" aria-hidden="true">
        <span className="note-google__fond"><Etoiles /></span>
        <span ref={pleinRef} className="note-google__plein" style={{ clipPath: `inset(0% ${vide}% 0% 0%)` }}>
          <Etoiles />
        </span>
      </span>
      <span className="note-google__nombre">{avis.nombre} avis Google</span>
    </a>
  );
};

export default NoteGoogle;
