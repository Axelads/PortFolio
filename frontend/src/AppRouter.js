import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import ProjectDetails from './pages/ProjectDetails';
import NotFound from './pages/NotFound';

const AppRouter = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/About" element={<About />} />
    <Route path="/projet/:id" element={<ProjectDetails />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRouter;