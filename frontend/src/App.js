import React, { Suspense, lazy, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Loading from './components/Loading';
import ScrollToTop from './pages/Scroll/ScrollToTop';
import AppRouter from './AppRouter';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import AmbientBackground from './components/Ambient/AmbientBackground';
import MesureAudience from './components/MesureAudience/MesureAudience';
import { LoadingProvider, LoadingContext } from './contexts/LoadingContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { estRouteTableauDeBord } from './pages/TableauDeBord/constantes';

// Le chatbot n'est pas nécessaire au premier rendu : chunk séparé, chargé après.
const Chatbot = lazy(() => import('./components/Chatbot/Chatbot'));

const App = ({ underSplash }) => {
  const { pathname } = useLocation();

  // Tableau de bord privé : page autonome, sans l'habillage public (en-tête, pied de page, chatbot, fond animé).
  // Rien n'y renvoie depuis le site, et sa politique de sécurité (CSP) n'autorise que l'API.
  if (estRouteTableauDeBord(pathname)) {
    return (
      <main className="app-tableau-de-bord">
        <AppRouter />
      </main>
    );
  }
  // Page de signature électronique (/signer/:jeton) : lien personnel reçu par e-mail, page autonome elle aussi.
  if (pathname.startsWith('/signer/')) {
    return (
      <main className="app-tableau-de-bord">
        <AppRouter />
      </main>
    );
  }

  return (
    <div className={`app-container${underSplash ? ' app-container--under-splash' : ''}`}>
      <AmbientBackground />
      <ScrollToTop />
      {/* Mesure de fréquentation sans cookie (site public seulement : ni tableau de bord, ni signature, ni admin). */}
      <MesureAudience />
      <Header />
      <main>
        <AppRouter />
      </main>
      <Footer />
      <Suspense fallback={null}>
        <Chatbot />
      </Suspense>
    </div>
  );
};

const AppWrapper = () => {
  // Balises <head> et bloc H1 posés dans le HTML pré-rendu (scripts/prerender-seo.mjs, attribut data-ssr) :
  // une fois React monté, Helmet (src/components/Seo.js) est seul maître des balises de la page.
  useEffect(() => {
    document.querySelectorAll('[data-ssr]').forEach((noeud) => noeud.remove());
  }, []);

  return (
    <ThemeProvider>
      <LoadingProvider>
        <AppWithLoading />
      </LoadingProvider>
    </ThemeProvider>
  );
};

const AppWithLoading = () => {
  const { isFirstLoad, splashFading } = useContext(LoadingContext);
  // L'app est TOUJOURS montée : elle se prépare pendant le splash (pas de
  // montage massif après coup) et le vrai DOM existe immédiatement pour les
  // audits et les robots. Le loading n'est qu'un overlay opaque par-dessus.
  // Tant que l'overlay est opaque, l'app est en opacity 0 : ce qui est caché
  // sous le splash ne doit pas être compté comme « peint » (LCP mobile mesuré
  // sur un paragraphe invisible), et l'arbre d'accessibilité reste complet.
  return (
    <>
      <App underSplash={isFirstLoad && !splashFading} />
      {isFirstLoad && <Loading />}
    </>
  );
};

export default AppWrapper;
