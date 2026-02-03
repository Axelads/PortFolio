import React, { useContext, useEffect } from 'react';
import Loading from './components/Loading';
import ScrollToTop from './pages/Scroll/ScrollToTop';
import AppRouter from './AppRouter';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import { LoadingProvider, LoadingContext } from './contexts/LoadingContext';
import { ThemeProvider } from './contexts/ThemeContext';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const App = () => {
  return (
    <div className="app-container">
      <ScrollToTop />
      <Header />
      <main>
        <AppRouter />
      </main>
      <Footer />
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
  const { isFirstLoad, setIsFirstLoad } = useContext(LoadingContext);

  useEffect(() => {
    if (isFirstLoad) {
      const timer = setTimeout(() => setIsFirstLoad(false), 4000);
      return () => clearTimeout(timer); // Nettoyage après 4 secondes
    }
  }, [isFirstLoad, setIsFirstLoad]);

  return isFirstLoad ? <Loading /> : <App />;
};

export default AppWrapper;
