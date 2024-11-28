import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Import de useNavigate
import SkillProjects from "../components/Skills/skillProjects";
import dataProjects from "../assets/Data/DataProject.json";

const ProjectDetails = () => {
  const { id } = useParams(); // Récupération de l'ID depuis l'URL
  const navigate = useNavigate(); // Initialisation de useNavigate

  // Rechercher le projet correspondant
  const project = dataProjects.find((proj) => proj.slug === id);

  // Si le projet n'existe pas, rediriger vers la page 404
  useEffect(() => {
    if (!project) {
      navigate("/404", { replace: true }); // Remplacement de l'URL pour éviter l'historique
    }
  }, [project, navigate]);

  // Ne pas rendre le contenu si le projet est inexistant (évite des erreurs avant la redirection)
  if (!project) {
    return null;
  }

  return (
    <div className="project-details">
      <h1>{project.name}</h1>
      <div className="Project">
        <p className="project-date">Date: {project.date}</p>
        <p className="project-status">
          Statut: {project.completed ? "Terminé" : "En cours"}
        </p>
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
