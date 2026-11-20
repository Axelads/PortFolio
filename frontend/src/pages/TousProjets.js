import React from 'react';
import Seo from '../components/Seo';
import Projects from '../components/Projects/Projects';

// Page /projets : tous les projets (l'accueil n'en montre qu'une sélection de sites). Même rendu que la section de
// l'accueil (sites dans l'ordinateur, applications sur tablette et téléphone, outils en cartes), sur le même fond.
const TousProjets = () => (
  <div className="page-projets informations">
    <Seo
      title="Tous les projets d'Axel Grégoire : sites, applications et outils"
      description="Les sites web, applications mobiles, outils et scripts réalisés par Axel Grégoire, développeur web et mobile : Next.js, React, React Native, Node.js et PocketBase."
      path="/projets"
    />
    <div id="projects">
      <Projects pageEntiere />
    </div>
  </div>
);

export default TousProjets;
