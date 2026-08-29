import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaGoogle } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeContext';

// Bouton Google « Sources préférées » (Preferred Sources) : le lecteur qui clique
// verra le site plus souvent dans Discover, À la une, Google Actualités et les
// résumés IA. Docs : https://developers.google.com/search/docs/appearance/preferred-sources
//
// Choix d'implémentation :
// - bouton maison (tokens du site, dark/light) plutôt que le rendu Google ;
// - `href` = deeplink Google → fonctionne même si le script est bloqué (adblock,
//   réseau) ou pas encore chargé ;
// - le script Google n'est chargé que lorsque le footer entre dans le viewport,
//   jamais au chargement initial (Lighthouse), en mode « manual » (pas de rendu
//   automatique) ; au clic, `addPreferredSource()` ajoute la source et ramène le
//   lecteur sur la page.

const SITE_DOMAIN = 'axelgregoire.fr';
const DEEPLINK = `https://www.google.com/preferences/source?q=${SITE_DOMAIN}`;
const SCRIPT_SRC = 'https://news.google.com/swg/js/v1/publisher.js';

// Chargement unique de la lib, résolu avec l'objet `preferredSource` que Google
// pousse dans la file globale PREFERRED_SOURCE.
let libPromise = null;
const loadPreferredSourceLib = () => {
  if (libPromise) return libPromise;
  libPromise = new Promise((resolve, reject) => {
    window.PREFERRED_SOURCE = window.PREFERRED_SOURCE || [];
    window.PREFERRED_SOURCE.push((preferredSource) => resolve(preferredSource));

    const script = document.createElement('script');
    script.async = true;
    script.src = SCRIPT_SRC;
    script.setAttribute('preferred-sources-control', 'manual');
    script.onerror = () => {
      libPromise = null; // autorise une nouvelle tentative au prochain montage
      reject(new Error('Lib Google Preferred Sources indisponible'));
    };
    document.head.appendChild(script);
  });
  return libPromise;
};

const PreferredSourceButton = () => {
  const { isDark } = useTheme();
  const rootRef = useRef(null);
  const libRef = useRef(null);
  const [ready, setReady] = useState(false);

  // Chargement paresseux : uniquement quand le bloc approche du viewport
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;

    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        loadPreferredSourceLib()
          .then((lib) => {
            if (cancelled) return;
            libRef.current = lib;
            setReady(true);
          })
          .catch(() => {
            /* le lien deeplink reste pleinement fonctionnel */
          });
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  // Thème de l'UI Google aligné sur celui du site
  useEffect(() => {
    if (!ready || !libRef.current) return;
    try {
      libRef.current.init({ theme: isDark ? 'dark' : 'light', lang: 'fr' });
    } catch (error) {
      /* init non ré-appelable : on garde le thème initial */
    }
  }, [ready, isDark]);

  const handleClick = useCallback((event) => {
    if (!libRef.current) return; // lib absente : navigation normale vers le deeplink
    event.preventDefault();
    try {
      libRef.current.addPreferredSource();
    } catch (error) {
      window.open(DEEPLINK, '_blank', 'noopener');
    }
  }, []);

  return (
    <div className="footer-preferred" ref={rootRef}>
      <a
        className="footer-preferred-btn"
        href={DEEPLINK}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
      >
        <FaGoogle aria-hidden="true" />
        <span>Ajouter {SITE_DOMAIN} à mes sources préférées</span>
      </a>
      <p className="footer-preferred-hint">
        Pour voir mes articles plus souvent dans Google Discover, Actualités et les résumés IA.
      </p>
    </div>
  );
};

export default PreferredSourceButton;
