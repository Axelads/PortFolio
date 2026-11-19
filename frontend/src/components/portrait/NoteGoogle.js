import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { assezDAvis, formaterNote, useAvisGoogle } from '../AvisGoogle/avisGoogle';
import { Etoiles, LogoGoogle } from '../AvisGoogle/Visuels';

// Note de la fiche Google d'Axel, sous « Freelance — Rougiers… » dans le portrait : logo Google, note, étoiles, nombre
// d'avis, et un lien vers les avis (le visiteur peut vérifier qu'ils sont vrais). Rien avant 5 avis.
// Données : components/AvisGoogle/avisGoogle.js (instantané du build, mémoire locale, puis API).

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const NoteGoogle = () => {
  const releve = useAvisGoogle();
  const lienRef = useRef(null);
  const pleinRef = useRef(null);

  const visible = assezDAvis(releve);
  const vide = visible ? 100 - (releve.note / 5) * 100 : 100;
  // Lu au moment d'animer : une note rafraîchie ensuite ne relance pas l'entrée (React met alors le rognage à jour).
  const videRef = useRef(vide);
  videRef.current = vide;

  // Entrée : la carte monte après le portrait, puis les étoiles se remplissent jusqu'à la note. Une fois par apparition.
  useEffect(() => {
    if (!visible || prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ delay: 0.9 })
        .fromTo(lienRef.current, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', clearProps: 'transform,opacity' })
        .fromTo(
          pleinRef.current,
          { clipPath: 'inset(0% 100% 0% 0%)' },
          { clipPath: `inset(0% ${videRef.current}% 0% 0%)`, duration: 0.9, ease: 'power2.out' },
          '-=0.3',
        );
    });
    return () => ctx.revert();
  }, [visible]);

  if (!visible) return null;

  const note = formaterNote(releve.note);
  return (
    <a
      ref={lienRef}
      className="note-google"
      href={releve.lien}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Note Google : ${note} sur 5, ${releve.nombre} avis. Voir les avis sur Google (nouvel onglet)`}
    >
      <span className="note-google__logo">
        <LogoGoogle />
      </span>
      <span className="note-google__corps">
        <span className="note-google__ligne">
          <span className="note-google__valeur">{note}</span>
          <Etoiles ref={pleinRef} note={releve.note} />
        </span>
        <span className="note-google__nombre">{releve.nombre} avis sur Google</span>
      </span>
      <svg className="note-google__fleche" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d="M5 11L11 5M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
};

export default NoteGoogle;
