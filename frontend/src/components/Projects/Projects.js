import React from "react";
import dataProjects from "../../assets/Data/DataProject.json";

const Projects = () => {
  const handleCardClick = (slug) => {
    window.open(`/Projet/${slug}`, "_blank"); // Utilise le slug pour l'URL
  };

  return (
    <section className="projects-container">
      <h2>Mes Projets</h2>
      <div className="projects-list">
        {dataProjects.map((project) => (
          <div
            key={project._id} // Utilisation de l'_id comme clé unique
            className="project-card"
            onClick={() => handleCardClick(project.slug)} // Utilisation du slug
          >
            <div
              className="project-image"
              style={{ backgroundImage: `url(${project.imageUrls[0]})` }} // Première image
            ></div>
            <div className="project-details">{project.name}</div>
          </div>
        ))}
      </div>
      <div className="divider"></div>
    </section>
  );
};

export default Projects;
