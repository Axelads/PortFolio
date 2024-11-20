import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/styles.css';
import AppWrapper from './App'; // AppWrapper inclut le contexte LoadingProvider
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();