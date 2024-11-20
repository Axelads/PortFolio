import React, { useContext, useEffect } from 'react';
import Loading from './components/Loading';
import AppRouter from './AppRouter';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import { LoadingProvider, LoadingContext } from './contexts/LoadingContext';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const App = () => {
  const { isFirstLoad, setIsFirstLoad } = useContext(LoadingContext);

  useEffect(() => {
    if (isFirstLoad) {
      const timer = setTimeout(() => setIsFirstLoad(false), 4000);
      return () => clearTimeout(timer); // Nettoyage
    }
  }, [isFirstLoad, setIsFirstLoad]);

  return isFirstLoad ? (
    <Loading />
  ) : (
    <div className="app-container">
      <Header />
      <main>
        <AppRouter />
      </main>
      <Footer />
    </div>
  );
};

const AppWrapper = () => (
  <LoadingProvider>
    <App />
  </LoadingProvider>
);

export default AppWrapper;
