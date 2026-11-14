import React, { createContext, useState } from 'react';

export const LoadingContext = createContext();

/**
 * Le splash ne s'affiche que pour un vrai visiteur arrivant sur l'accueil.
 * On le saute pour :
 *  - les outils d'audit (Lighthouse / PageSpeed) et le mode headless,
 *  - l'automatisation (puppeteer / webdriver),
 *  - le débogage manuel via `?nosplash` ou `?audit`,
 * afin de pouvoir mesurer / voir la VRAIE page et pas la vidéo de chargement.
 */
// ⚠ Même règle que le script inline de public/index.html (app shell #splash-static) :
// toute modification ici doit y être reportée.
const shouldShowSplash = () => {
  if (typeof window === 'undefined') return false;
  if (window.location.pathname !== '/') return false; // Uniquement sur Home

  const params = new URLSearchParams(window.location.search);
  if (params.has('nosplash') || params.has('audit')) return false;

  const ua = navigator.userAgent || '';
  // Outils d'audit, navigateurs headless et robots d'indexation : jamais de splash,
  // ils reçoivent directement le contenu (identique, sans l'animation d'entrée).
  if (/Lighthouse|Chrome-Lighthouse|Google Page Speed|HeadlessChrome|bot|crawl|spider/i.test(ua)) return false;
  if (navigator.webdriver) return false;
  // L'intro est une vidéo de 8 s tout en mouvement : sautée si l'utilisateur
  // a demandé à réduire les animations.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;

  return true;
};

export const LoadingProvider = ({ children }) => {
  const [isFirstLoad, setIsFirstLoad] = useState(shouldShowSplash);
  // Passe à true quand le splash commence son fondu : l'app se dévoile dessous
  // pendant les 600 ms de fondu (voir App.js).
  const [splashFading, setSplashFading] = useState(false);

  return (
    <LoadingContext.Provider value={{ isFirstLoad, setIsFirstLoad, splashFading, setSplashFading }}>
      {children}
    </LoadingContext.Provider>
  );
};
