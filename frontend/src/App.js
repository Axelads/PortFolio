import React, { useContext } from 'react';
import Loading from './components/Loading';
import ScrollToTop from './pages/Scroll/ScrollToTop';
import AppRouter from './AppRouter';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Chatbot from './components/Chatbot/Chatbot';
import AmbientBackground from './components/Ambient/AmbientBackground';
import { LoadingProvider, LoadingContext } from './contexts/LoadingContext';
import { ThemeProvider } from './contexts/ThemeContext';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const App = () => {
  return (
    <div className="app-container">
      <AmbientBackground />
      <ScrollToTop />
      <Header />
      <main>
        <AppRouter />
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
};

const AppWrapper = () => {
  return (
    <ThemeProvider>
      <LoadingProvider>
        <AppWithLoading />
      </LoadingProvider>
    </ThemeProvider>
  );
};

const AppWithLoading = () => {
  const { isFirstLoad } = useContext(LoadingContext);
  // L'app est TOUJOURS montée : elle se prépare pendant le splash (pas de
  // montage massif après coup) et le vrai DOM existe immédiatement pour les
  // audits. Le loading n'est qu'un overlay opaque par-dessus.
  return (
    <>
      <App />
      {isFirstLoad && <Loading />}
    </>
  );
};

export default AppWrapper;
