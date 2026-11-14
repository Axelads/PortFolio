import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import { AuthProvider } from './contexts/AuthContext';
import { ROUTE_TABLEAU_DE_BORD } from './pages/TableauDeBord/constantes';

// Code splitting : seule la Home est dans le bundle initial. Les autres pages
// (dont l'admin qui embarque TipTap/ProseMirror ≈ 300 Ko) sont chargées à la
// demande, chacune dans son propre chunk.
const About = lazy(() => import('./pages/About'));
const CV = lazy(() => import('./pages/CV'));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Avis = lazy(() => import('./pages/Avis'));
const Carte = lazy(() => import('./pages/Carte'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogArticle = lazy(() => import('./pages/BlogArticle'));
const AdminLogin = lazy(() => import('./pages/Admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const TableauDeBord = lazy(() => import('./pages/TableauDeBord/TableauDeBord'));
const PageSignature = lazy(() => import('./pages/Signature/PageSignature'));

const AppRouter = () => (
  <AuthProvider>
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/About" element={<About />} />
        <Route path="/cv" element={<CV />} />
        <Route path="/Avis" element={<Avis />} />
        <Route path="/Projet/:id" element={<ProjectDetails />} />
        <Route path="/carte" element={<Carte />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogArticle />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path={`${ROUTE_TABLEAU_DE_BORD}/*`} element={<TableauDeBord />} />
        <Route path="/signer/:jeton" element={<PageSignature />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </AuthProvider>
);

export default AppRouter;
