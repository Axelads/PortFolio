import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import ProjectDetails from './pages/ProjectDetails';
import NotFound from './pages/NotFound';
import Avis from './pages/Avis';
import Carte from './pages/Carte';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import { AuthProvider } from './contexts/AuthContext';

const AppRouter = () => (
  <AuthProvider>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/About" element={<About />} />
      <Route path="/Avis" element={<Avis />} />
      <Route path="/Projet/:id" element={<ProjectDetails />} />
      <Route path="/carte" element={<Carte />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </AuthProvider>
);

export default AppRouter;
