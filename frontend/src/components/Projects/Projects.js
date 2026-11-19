import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CategoryFilter, { CATEGORIES } from "./CategoryFilter";
import CarteAppareil, { TYPES_APPAREIL, animerOrdinateur, preparerOrdinateur } from "./CarteAppareil";
import { getProjects } from "../../services/pocketbase";
import dataProjectsFallback from "../../assets/Data/DataProject.json";

gsap.registerPlugin(ScrollTrigger);

// Force HTTPS sur les URLs d'images
const sanitizeUrl = (url) => {
  if (typeof url === 'string' && url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
};

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
            imageUrls: (project.imageUrls || []).map(sanitizeUrl),
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
    const cartes = cardsRef.current.filter(Boolean);
    if (!cartes.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }
    // Sites web : entrée propre aux ordinateurs (CarteAppareil.animerOrdinateur), rangée par rangée à l'arrivée à
    // l'écran. Les autres cartes gardent leur entrée en fondu, dès le rendu.
    const ordinateurs = cartes.filter((c) => c.classList.contains("projet-appareil--ordinateur"));
    const autres = cartes.filter((c) => !ordinateurs.includes(c));
    const ctx = gsap.context(() => {
      if (autres.length) {
        gsap.fromTo(
          autres,
          { y: 30, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.5,
            ease: "power2.out",
            stagger: 0.1,
            // Rend la main au CSS : sans ça, le transform en ligne bloque l'élévation au survol.
            clearProps: "transform,opacity",
          }
        );
      }
      if (ordinateurs.length) {
        ordinateurs.forEach((carte) => preparerOrdinateur(gsap, carte));
        ScrollTrigger.batch(ordinateurs, {
          start: "top 88%",
          once: true,
          // ctx.add : les timelines créées plus tard, à l'arrivée à l'écran, sont aussi nettoyées par ctx.revert().
          onEnter: (rangee) => ctx.add(() => rangee.forEach((carte, i) => animerOrdinateur(gsap, carte, i * 0.18))),
        });
      }
    }, projectsRef);
    return () => ctx.revert();
  }, [projects, activeCategory]);

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

  // statutEnLigne : l'état « En cours » se lit à côté de la date (cartes à appareils,
  // sans image de fond où poser le badge).
  const renderCardContent = (project, { statutEnLigne = false } = {}) => (
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
        {statutEnLigne && !project.completed && (
          <span className="card-statut">En cours</span>
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
  );

  // Un vrai lien (nouvel onglet) : accessible au clavier, lisible par les
  // crawlers et les agents, sans role="button" posé sur un <article>.
  // L'image est un <img loading="lazy"> : les visuels distants (souvent > 1 Mo)
  // ne sont téléchargés qu'à l'approche de la carte, pas au chargement.
  // Sites et applications : présentés dans leurs appareils (CarteAppareil).
  const renderProjectCard = (project, index) => {
    const typeAppareil = TYPES_APPAREIL[project.category];
    if (typeAppareil) {
      return (
        <CarteAppareil
          key={project._id || project.id}
          ref={(el) => (cardsRef.current[index] = el)}
          project={project}
          type={typeAppareil}
        >
          {renderCardContent(project, { statutEnLigne: true })}
        </CarteAppareil>
      );
    }
    return (
      <a
        key={project._id || project.id}
        ref={(el) => (cardsRef.current[index] = el)}
        className={`project-card ${project.completed ? "completed" : "in-progress"}`}
        href={`/Projet/${project.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Voir le projet ${project.name}`}
      >
        <div className="card-image-wrapper">
          {project.imageUrls?.[0] && (
            <img
              className="card-image"
              src={project.imageUrls[0]}
              alt=""
              loading="lazy"
              decoding="async"
            />
          )}
          <div className="card-overlay">
            <span className="view-project">Voir le projet</span>
          </div>
          {!project.completed && (
            <span className="status-badge">En cours</span>
          )}
        </div>
        {renderCardContent(project)}
      </a>
    );
  };

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
