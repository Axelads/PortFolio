import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CategoryFilter, { CATEGORIES } from "./CategoryFilter";
import { getProjects } from "../../services/pocketbase";
import dataProjectsFallback from "../../assets/Data/DataProject.json";

gsap.registerPlugin(ScrollTrigger);

const Projects = () => {
  const projectsRef = useRef(null);
  const cardsRef = useRef([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les projets depuis PocketBase
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log("Tentative de chargement depuis PocketBase...");
        const data = await getProjects();
        console.log("Données PocketBase reçues:", data);

        if (data && data.length > 0) {
          const mappedProjects = data.map((project) => ({
            ...project,
            _id: project.id,
            imageUrls: project.imageUrls || [],
            skillsUsed: project.skillsUsed || [],
          }));
          setProjects(mappedProjects);
        } else {
          console.log("Aucun projet dans PocketBase, utilisation du fallback");
          setProjects(dataProjectsFallback);
        }
      } catch (error) {
        console.error("Erreur chargement PocketBase:", error);
        setProjects(dataProjectsFallback);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    gsap.fromTo(
      projectsRef.current,
      { y: -50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: projectsRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      }
    );
  }, []);

  useEffect(() => {
    if (cardsRef.current.length > 0) {
      gsap.fromTo(
        cardsRef.current.filter(Boolean),
        { y: 30, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.1,
        }
      );
    }
  }, [projects, activeCategory]);

  const handleCardClick = (slug) => {
    window.open(`/Projet/${slug}`, "_blank");
  };

  const handleCategoryChange = (categoryId) => {
    cardsRef.current = [];
    setActiveCategory(categoryId);
  };

  const getCategoryLabel = (categoryId) => {
    const category = CATEGORIES.find((cat) => cat.id === categoryId);
    return category ? category.name : "";
  };

  const getCategoryIcon = (categoryId) => {
    const category = CATEGORIES.find((cat) => cat.id === categoryId);
    return category ? category.icon : "";
  };

  // Grouper les projets par catégorie
  const getProjectsByCategory = () => {
    const categoryOrder = ["site-web", "application-mobile", "outils-scripts"];
    const grouped = {};

    categoryOrder.forEach((cat) => {
      const categoryProjects = projects.filter((p) => p.category === cat);
      if (categoryProjects.length > 0) {
        grouped[cat] = categoryProjects;
      }
    });

    // Ajouter les projets sans catégorie
    const uncategorized = projects.filter((p) => !p.category || !categoryOrder.includes(p.category));
    if (uncategorized.length > 0) {
      grouped["other"] = uncategorized;
    }

    return grouped;
  };

  // Filtrer les projets selon la catégorie active
  const getFilteredProjects = () => {
    if (activeCategory === "all") {
      return projects;
    }
    return projects.filter((project) => project.category === activeCategory);
  };

  const filteredProjects = getFilteredProjects();
  const groupedProjects = activeCategory === "all" ? getProjectsByCategory() : null;

  // Compter le total des projets affichés
  const totalCount = filteredProjects.length;

  const renderProjectCard = (project, index) => (
    <article
      key={project._id || project.id}
      ref={(el) => (cardsRef.current[index] = el)}
      className={`project-card ${project.completed ? "completed" : "in-progress"}`}
      onClick={() => handleCardClick(project.slug)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleCardClick(project.slug)}
    >
      <div className="card-image-wrapper">
        <div
          className="card-image"
          style={{ backgroundImage: `url(${project.imageUrls?.[0] || ''})` }}
        />
        <div className="card-overlay">
          <span className="view-project">Voir le projet</span>
        </div>
        {!project.completed && (
          <span className="status-badge">En cours</span>
        )}
      </div>
      <div className="card-content">
        <h3 className="card-title">{project.name}</h3>
        <div className="card-meta">
          <span className="card-date">
            {project.date && new Date(project.date).toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "short",
            })}
          </span>
          {project.category && (
            <span className="card-category">
              {getCategoryLabel(project.category)}
            </span>
          )}
        </div>
        <div className="card-skills">
          {(project.skillsUsed || []).slice(0, 3).map((skill, i) => (
            <span key={i} className="skill-tag">
              {skill}
            </span>
          ))}
          {(project.skillsUsed || []).length > 3 && (
            <span className="skill-tag more">
              +{project.skillsUsed.length - 3}
            </span>
          )}
        </div>
      </div>
    </article>
  );

  if (loading) {
    return (
      <section className="projects-container" ref={projectsRef}>
        <div className="projects-header">
          <h2>Mes Projets</h2>
          <p className="projects-subtitle">Chargement...</p>
        </div>
      </section>
    );
  }

  let cardIndex = 0;

  return (
    <section className="projects-container" ref={projectsRef}>
      <div className="projects-header">
        <h2>Mes Projets</h2>
        <p className="projects-subtitle">
          Découvrez mes réalisations classées par catégorie
        </p>
      </div>

      <CategoryFilter
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      <div className="projects-count">
        <span className="count-number">{totalCount}</span>
        <span className="count-text">
          projet{totalCount > 1 ? "s" : ""}
          {activeCategory !== "all" && ` en ${getCategoryLabel(activeCategory)}`}
        </span>
      </div>

      {activeCategory === "all" && groupedProjects ? (
        // Vue groupée par catégorie
        <div className="projects-grouped">
          {Object.entries(groupedProjects).map(([categoryId, categoryProjects]) => (
            <div key={categoryId} className="category-section">
              <div className="category-header">
                <span className="category-icon">{getCategoryIcon(categoryId)}</span>
                <h3 className="category-title">
                  {categoryId === "other" ? "Autres" : getCategoryLabel(categoryId)}
                </h3>
                <span className="category-count">{categoryProjects.length}</span>
              </div>
              <div className="projects-grid">
                {categoryProjects.map((project) => {
                  const card = renderProjectCard(project, cardIndex);
                  cardIndex++;
                  return card;
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Vue filtrée simple
        <div className="projects-grid">
          {filteredProjects.map((project, index) => renderProjectCard(project, index))}
        </div>
      )}

      {totalCount === 0 && (
        <div className="no-projects">
          <p>Aucun projet dans cette catégorie pour le moment.</p>
        </div>
      )}

      <div className="divider"></div>
    </section>
  );
};

export default Projects;
