import React, { useEffect, useState } from "react";
import Seo, { SITE_URL } from "../components/Seo";
import { useParams, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import SkillProjects from "../components/Skills/skillProjects";
import GalerieProjet from "../components/Projects/GalerieProjet";
import VitrineProjet from "../components/Projects/VitrineProjet";
import VITRINES from "../assets/Data/DataVitrines.json";
import { getProjectBySlug } from "../services/pocketbase";

// Supprime les balises HTML pour la meta description SEO
const stripHtml = (html) => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

// Force HTTPS sur les URLs d'images
const sanitizeUrl = (url) => {
  if (typeof url === 'string' && url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
};

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
            imageUrls: (data.imageUrls || []).map(sanitizeUrl),
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
      <Seo
        title={`${project.name} - Projet | Axel Grégoire`}
        description={project.resume ? stripHtml(project.resume).substring(0, 160) : `Découvrez le projet ${project.name} réalisé par Axel Grégoire.`}
        path={`/Projet/${encodeURIComponent(project.slug)}`}
        image={project.imageUrls?.[0] ? sanitizeUrl(project.imageUrls[0]) : undefined}
        imageAlt={project.name}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: "Projets", item: `${SITE_URL}/#projects` },
            { "@type": "ListItem", position: 3, name: project.name, item: `${SITE_URL}/Projet/${encodeURIComponent(project.slug)}` },
          ],
        }}
      />
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
            <div
              className="project-resume-html"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(project.resume),
              }}
            />

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

      {/* Captures du projet : une seule rangée animée (GalerieProjet) */}
      <GalerieProjet images={project.imageUrls} nom={project.name} />

      {/* Vitrine : éléments réels du site, liens directs (DataVitrines.json) */}
      <VitrineProjet vitrine={VITRINES[project.slug]} />
    </div>
  );
};

export default ProjectDetails;
