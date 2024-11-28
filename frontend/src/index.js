import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/styles.css';
import App from './App'; // Import de App directement
import { LoadingProvider } from './contexts/LoadingContext'; // Ajout de LoadingProvider
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <LoadingProvider> {/* Ajout du contexte LoadingProvider ici */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </LoadingProvider>
  </React.StrictMode>
);

reportWebVitals();
