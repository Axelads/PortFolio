import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SkillProjects from "../components/Skills/skillProjects";
import { getProjectBySlug } from "../services/pocketbase";

// Mapping des vidéos locales (slug -> chemin vidéo)
const LOCAL_VIDEOS = {
  "CharcuterieNouvelle-fr": "/video/Presentation_Site_Cedric.mp4",
  "Mon-paysagiste": "/video/Presentation_Paysagiste.mp4",
};

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        console.log("Chargement du projet:", id);
        const data = await getProjectBySlug(id);
        console.log("Projet reçu:", data);

        if (data) {
          // Ajouter la vidéo locale si elle existe
          const projectWithVideo = {
            ...data,
            videoUrl: LOCAL_VIDEOS[data.slug] || null,
            imageUrls: data.imageUrls || [],
            skillsUsed: data.skillsUsed || [],
            objectives: data.objectives || [],
          };
          setProject(projectWithVideo);
        } else {
          setError("Projet non trouvé");
        }
      } catch (err) {
        console.error("Erreur chargement projet:", err);
        setError("Erreur lors du chargement du projet");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  // Rediriger vers 404 si erreur ou projet non trouvé
  useEffect(() => {
    if (!loading && error) {
      navigate("/404", { replace: true });
    }
  }, [loading, error, navigate]);

  if (loading) {
    return (
      <div className="project-details">
        <div className="loading-state">
          <p>Chargement du projet...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="project-details">
      <h1>{project.name}</h1>
      <div className="Project">
        <p className="project-date">
          Date: {project.date && new Date(project.date).toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <p className="project-status">
          Statut: {project.completed ? "Terminé" : "En cours"}
        </p>

        {/* Résumé du projet */}
        {project.resume && (
          <div className="project-resume">
            <p>{project.resume}</p>

            {/* Objectifs sous forme de liste */}
            {project.objectives && project.objectives.length > 0 && (
              <ul className="project-objectives">
                {project.objectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            )}
          </div>
        )}
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
            href={project.liveUrl.startsWith("http") ? project.liveUrl : `https://${project.liveUrl}`}
            className="live-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Voir le site
          </a>
        )}
      </div>

      {/* Vidéo locale si disponible */}
      {project.videoUrl && (
        <div className="project-video">
          <video controls>
            <source src={project.videoUrl} type="video/mp4" />
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
        </div>
      )}

      {/* Images du projet */}
      {project.imageUrls && project.imageUrls.length > 0 && (
        <div className="project-images">
          {project.imageUrls.map((url, index) => (
            <img key={index} src={url} alt={`${project.name} - ${index + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
