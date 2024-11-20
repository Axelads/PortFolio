import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';


const Projects = () => {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5001/api/projects')
      .then((response) => response.json())
      .then((data) => setProjects(data))
      .catch((error) => console.error('Erreur lors de la récupération des projets:', error));
  }, []);

  const handleCardClick = (id) => {
    navigate(`/Projet/${id}`);
  };

  return (
    <section className="projects-container">
      <h2>Mes Projets</h2>
      <div className="projects-list">
        {projects.map((project) => (
          <div
            key={project._id} // Utilisation de project._id comme clé unique
            className="project-card"
            onClick={() => handleCardClick(project._id)}
          >
            <div
              className="project-image"
              style={{ backgroundImage: `url(${project.imageUrls[0]})` }}
            ></div>
            <div className="project-details">{project.name}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Projects;
