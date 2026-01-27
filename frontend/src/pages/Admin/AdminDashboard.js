import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../../services/pocketbase";

const CATEGORIES = [
  { id: "site-web", name: "Site Web" },
  { id: "application-mobile", name: "Application Mobile" },
  { id: "outils-scripts", name: "Outils & Scripts" },
];

const emptyProject = {
  slug: "",
  nom: "",
  date: "",
  completed: false,
  category: "site-web",
  resume: "",
  imageUrls: [],
  githubUrl: "",
  liveUrl: "",
  skillsUsed: [],
};

const AdminDashboard = () => {
  const { admin, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState(emptyProject);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Skills input
  const [skillInput, setSkillInput] = useState("");

  // Image URLs input
  const [imageInput, setImageInput] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/admin");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      setError("Erreur lors du chargement des projets");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/admin");
  };

  const openCreateModal = () => {
    setEditingProject(null);
    setFormData(emptyProject);
    setSkillInput("");
    setImageInput("");
    setShowModal(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setFormData({
      slug: project.slug || "",
      nom: project.nom || "",
      date: project.date ? project.date.split("T")[0] : "",
      completed: project.completed || false,
      category: project.category || "site-web",
      resume: project.resume || "",
      imageUrls: project.imageUrls || [],
      githubUrl: project.githubUrl || "",
      liveUrl: project.liveUrl || "",
      skillsUsed: project.skillsUsed || [],
    });
    setSkillInput("");
    setImageInput("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProject(null);
    setFormData(emptyProject);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skillsUsed.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        skillsUsed: [...prev.skillsUsed, skillInput.trim()],
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (skill) => {
    setFormData((prev) => ({
      ...prev,
      skillsUsed: prev.skillsUsed.filter((s) => s !== skill),
    }));
  };

  const addImageUrl = () => {
    if (imageInput.trim() && !formData.imageUrls.includes(imageInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, imageInput.trim()],
      }));
      setImageInput("");
    }
  };

  const removeImageUrl = (url) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((u) => u !== url),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const projectData = {
        ...formData,
        date: formData.date ? new Date(formData.date).toISOString() : null,
      };

      if (editingProject) {
        await updateProject(editingProject.id, projectData);
        setSuccess("Projet mis à jour avec succès !");
      } else {
        await createProject(projectData);
        setSuccess("Projet créé avec succès !");
      }

      closeModal();
      fetchProjects();
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProject(id);
      setSuccess("Projet supprimé avec succès !");
      setDeleteConfirm(null);
      fetchProjects();
    } catch (err) {
      setError(err.message || "Erreur lors de la suppression");
    }
  };

  const getCategoryName = (id) => {
    const cat = CATEGORIES.find((c) => c.id === id);
    return cat ? cat.name : id;
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="header-left">
          <h1>Dashboard Admin</h1>
          <span className="admin-email">{admin?.email}</span>
        </div>
        <div className="header-right">
          <a href="/" className="btn-secondary" target="_blank" rel="noopener noreferrer">
            Voir le site
          </a>
          <button onClick={handleLogout} className="btn-logout">
            Déconnexion
          </button>
        </div>
      </header>

      {/* Messages */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError("")}>&times;</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess("")}>&times;</button>
        </div>
      )}

      {/* Content */}
      <main className="admin-content">
        <div className="content-header">
          <h2>Gestion des Projets</h2>
          <button onClick={openCreateModal} className="btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nouveau Projet
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Chargement des projets...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3>Aucun projet</h3>
            <p>Commencez par créer votre premier projet</p>
            <button onClick={openCreateModal} className="btn-primary">
              Créer un projet
            </button>
          </div>
        ) : (
          <div className="projects-table-container">
            <table className="projects-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Catégorie</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td className="project-name">
                      <strong>{project.nom}</strong>
                      <span className="project-slug">/{project.slug}</span>
                    </td>
                    <td>
                      <span className={`category-badge ${project.category}`}>
                        {getCategoryName(project.category)}
                      </span>
                    </td>
                    <td>
                      {project.date
                        ? new Date(project.date).toLocaleDateString("fr-FR")
                        : "-"}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          project.completed ? "completed" : "in-progress"
                        }`}
                      >
                        {project.completed ? "Terminé" : "En cours"}
                      </span>
                    </td>
                    <td className="actions">
                      <button
                        onClick={() => openEditModal(project)}
                        className="btn-icon edit"
                        title="Modifier"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(project.id)}
                        className="btn-icon delete"
                        title="Supprimer"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal Formulaire */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProject ? "Modifier le projet" : "Nouveau projet"}</h2>
              <button onClick={closeModal} className="modal-close">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="project-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nom">Nom du projet *</label>
                  <input
                    type="text"
                    id="nom"
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange}
                    required
                    placeholder="Mon Super Projet"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="slug">Slug (URL) *</label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                    placeholder="mon-super-projet"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Catégorie</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="date">Date</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="completed"
                    checked={formData.completed}
                    onChange={handleInputChange}
                  />
                  <span>Projet terminé</span>
                </label>
              </div>

              <div className="form-group">
                <label htmlFor="resume">Description</label>
                <textarea
                  id="resume"
                  name="resume"
                  value={formData.resume}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Décrivez votre projet..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="githubUrl">URL GitHub</label>
                  <input
                    type="url"
                    id="githubUrl"
                    name="githubUrl"
                    value={formData.githubUrl}
                    onChange={handleInputChange}
                    placeholder="https://github.com/..."
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="liveUrl">URL Live</label>
                  <input
                    type="url"
                    id="liveUrl"
                    name="liveUrl"
                    value={formData.liveUrl}
                    onChange={handleInputChange}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Skills */}
              <div className="form-group">
                <label>Compétences utilisées</label>
                <div className="tag-input-wrapper">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Ajouter une compétence..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <button type="button" onClick={addSkill} className="btn-add">
                    +
                  </button>
                </div>
                <div className="tags-list">
                  {formData.skillsUsed.map((skill, i) => (
                    <span key={i} className="tag">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)}>
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Image URLs */}
              <div className="form-group">
                <label>URLs des images</label>
                <div className="tag-input-wrapper">
                  <input
                    type="url"
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    placeholder="https://exemple.com/image.jpg"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addImageUrl();
                      }
                    }}
                  />
                  <button type="button" onClick={addImageUrl} className="btn-add">
                    +
                  </button>
                </div>
                <div className="image-list">
                  {formData.imageUrls.map((url, i) => (
                    <div key={i} className="image-item">
                      <img src={url} alt={`Preview ${i + 1}`} />
                      <button type="button" onClick={() => removeImageUrl(url)}>
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Enregistrement..." : editingProject ? "Mettre à jour" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmation Suppression */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content modal-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3>Confirmer la suppression</h3>
            <p>Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.</p>
            <div className="confirm-actions">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">
                Annuler
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
