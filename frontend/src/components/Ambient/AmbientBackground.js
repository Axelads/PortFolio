import React from 'react';

/**
 * AmbientBackground
 * Couche d'ambiance "design 2026" :
 *  - Aurora / mesh gradient animé en fond (z-index:-1)
 *  - Grain filmique en overlay (soft-light)
 *
 * Theming 100% CSS via [data-theme]. Respecte prefers-reduced-motion.
 * Aucune interaction (pointer-events: none).
 */
const AmbientBackground = () => {
  return (
    <>
      {/* Fond : aurora / mesh gradient (derrière le contenu) */}
      <div className="ambient" aria-hidden="true">
        <div className="ambient__aurora">
          <span className="ambient__blob ambient__blob--1" />
          <span className="ambient__blob ambient__blob--2" />
          <span className="ambient__blob ambient__blob--3" />
        </div>
      </div>

      {/* Overlay : grain filmique (au-dessus du contenu) */}
      <div className="ambient-grain" aria-hidden="true" />
    </>
  );
};

export default AmbientBackground;
