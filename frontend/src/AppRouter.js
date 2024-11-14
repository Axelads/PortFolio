import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import CV from './components/CV/CV';

const AppRouter = () => (
  <Router>
    <Routes>
      <Route path="/Portfolio" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/cv" element={<CV />} />
    </Routes>
  </Router>
);

export default AppRouter;