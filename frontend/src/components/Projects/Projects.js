import React from 'react';
import { useNavigate } from 'react-router-dom';
import dataProjects from '../../assets/Data/DataProject.json'; // Chemin vers le fichier JSON

const Projects = () => {
  const navigate = useNavigate();

  const handleCardClick = (id) => {
    navigate(`/Projet/${id}`);
  };

  return (
    <section className="projects-container">
      <h2>Mes Projets</h2>
      <div className="projects-list">
        {dataProjects.map((project) => (
          <div
            key={project._id.$oid} // Utilisation de project._id comme clé unique
            className="project-card"
            onClick={() => handleCardClick(project._id.$oid)}
          >
            <div
              className="project-image"
              style={{ backgroundImage: `url(${project.imageUrls[0]})` }}
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
