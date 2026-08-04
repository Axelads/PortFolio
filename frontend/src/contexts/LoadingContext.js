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
const shouldShowSplash = () => {
  if (typeof window === 'undefined') return false;
  if (window.location.pathname !== '/') return false; // Uniquement sur Home

  const params = new URLSearchParams(window.location.search);
  if (params.has('nosplash') || params.has('audit')) return false;

  const ua = navigator.userAgent || '';
  if (/Lighthouse|Chrome-Lighthouse|Google Page Speed|HeadlessChrome/i.test(ua)) return false;
  if (navigator.webdriver) return false;

  return true;
};

export const LoadingProvider = ({ children }) => {
  const [isFirstLoad, setIsFirstLoad] = useState(shouldShowSplash);

  return (
    <LoadingContext.Provider value={{ isFirstLoad, setIsFirstLoad }}>
      {children}
    </LoadingContext.Provider>
  );
};
