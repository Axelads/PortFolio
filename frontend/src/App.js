import React, { useContext, useEffect } from 'react';
import './styles/App.scss';
import Loading from './components/Loading';
import AppRouter from './AppRouter';
import { LoadingProvider, LoadingContext } from './contexts/LoadingContext';

function App() {
  const { isFirstLoad, setIsFirstLoad } = useContext(LoadingContext);

  useEffect(() => {
    if (isFirstLoad) {
      setTimeout(() => setIsFirstLoad(false), 5000);
    }
  }, [isFirstLoad, setIsFirstLoad]);

  return isFirstLoad ? <Loading /> : <AppRouter />;
}

export default function AppWrapper() {
  return (
    <LoadingProvider>
      <App />
    </LoadingProvider>
  );
}