import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './ProjectDetails.scss';

const ProjectDetails = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5001/api/projects/${id}`)
      .then((response) => response.json())
      .then((data) => setProject(data))
      .catch((error) => console.error('Erreur lors de la récupération du projet:', error));
  }, [id]);

  if (!project) {
    return <p>Chargement du projet...</p>;
  }

  return (
    <div className="project-details">
      <h1>{project.name}</h1>
      <p>Date: {new Date(project.date).toLocaleDateString()}</p>
      <p>Status: {project.completed ? 'Terminé' : 'En cours'}</p>
      <div className="project-images">
        {project.imageUrls.map((url, index) => (
          <img key={index} src={url} alt={`Project ${project.name}`} />
        ))}
      </div>
      <p>Compétences utilisées: {project.skillsUsed.join(', ')}</p>
      {project.githubUrl && <a href={project.githubUrl}>Voir sur GitHub</a>}
      {project.liveUrl && <a href={project.liveUrl}>Voir le site</a>}
    </div>
  );
};

export default ProjectDetails;