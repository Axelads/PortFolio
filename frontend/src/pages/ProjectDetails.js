import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SkillProjects from '../components/Skills/skillProjects';

const ProjectDetails = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);

  useEffect(() => {
    fetch(process.env.FETCH_URL + `projects/${id}`)
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
      <div className="Project">
        <p className="project-date">Date: {new Date(project.date).toLocaleDateString()}</p>
        <p className="project-status">Status: {project.completed ? 'Terminé' : 'En cours'}</p>
        <p className="project-resume">{project.Resume}</p>
      </div>
      {project.skillsUsed && project.skillsUsed.length > 0 && (
        <SkillProjects skills={project.skillsUsed} />
      )}
      <div className="project-visuel">
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            className="github-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.11 0 0 .67-.21 2.2.82a7.68 7.68 0 012.01-.27c.68 0 1.36.09 2.01.27 1.52-1.04 2.2-.82 2.2-.82.44 1.1.16 1.91.08 2.11.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.64 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.003 8.003 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Voir sur GitHub
          </a>
        )}
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            className="live-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Voir le site
          </a>
        )}
      </div>
      <div className="project-images">
        {project.imageUrls.map((url, index) => (
          <img key={index} src={url} alt={`Project ${project.name}`} />
        ))}
      </div>
    </div>
  );
};

export default ProjectDetails;
