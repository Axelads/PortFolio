import React, { useContext, useEffect } from 'react';
import './styles/App.scss';
import Loading from './components/Loading';
import AppRouter from './AppRouter';
import Header from './components/Header';
import Footer from './components/Footer/Footer';
import { LoadingProvider, LoadingContext } from './contexts/LoadingContext';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

function App() {
  const { isFirstLoad, setIsFirstLoad } = useContext(LoadingContext);

  useEffect(() => {
    if (isFirstLoad) {
      setTimeout(() => setIsFirstLoad(false), 4000);
    }
  }, [isFirstLoad, setIsFirstLoad]);

  return isFirstLoad ? (
    <Loading />
  ) : (
    <div className="app-container">
      <Header />
      <main>
        <AppRouter /> {/* Routes */}
      </main>
      <Footer />
    </div>
  );
}

export default function AppWrapper() {
  return (
    <LoadingProvider>
      <App />
    </LoadingProvider>
  );
}