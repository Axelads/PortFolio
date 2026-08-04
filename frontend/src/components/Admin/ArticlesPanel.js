import React, { useCallback, useEffect, useState } from "react";
import RichTextEditor from "./RichTextEditor";
import {
  BLOG_CATEGORIES,
  getCategoryLabel,
  getAllArticlesAdmin,
  createArticle,
  updateArticle,
  deleteArticle,
  parsePbDate,
} from "../../services/blog";

const emptyArticle = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "ia",
  tags: [],
  sources: [],
  reading_time: 5,
  published: false,
};

// Onglet "Articles" du dashboard : modération des articles générés par la
// routine (éditer, publier/dépublier, supprimer) + création manuelle.
const ArticlesPanel = ({ setError, setSuccess }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState(emptyArticle);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [tagInput, setTagInput] = useState("");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllArticlesAdmin();
      setArticles(data);
    } catch (err) {
      setError("Erreur lors du chargement des articles");
    } finally {
      setLoading(false);
    }
  }, [setError]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const openCreateModal = () => {
    setEditingArticle(null);
    setFormData(emptyArticle);
    setTagInput("");
    setSourceTitle("");
    setSourceUrl("");
    setShowModal(true);
  };

  const openEditModal = (article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title || "",
      slug: article.slug || "",
      excerpt: article.excerpt || "",
      content: article.content || "",
      category: article.category || "ia",
      tags: Array.isArray(article.tags) ? article.tags : [],
      sources: Array.isArray(article.sources) ? article.sources : [],
      reading_time: article.reading_time || 5,
      published: article.published || false,
    });
    setTagInput("");
    setSourceTitle("");
    setSourceUrl("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingArticle(null);
    setFormData(emptyArticle);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const addSource = () => {
    const title = sourceTitle.trim();
    const url = sourceUrl.trim();
    if (title && /^https?:\/\//.test(url)) {
      setFormData((prev) => ({ ...prev, sources: [...prev.sources, { title, url }] }));
      setSourceTitle("");
      setSourceUrl("");
    }
  };

  const removeSource = (index) => {
    setFormData((prev) => ({
      ...prev,
      sources: prev.sources.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const articleData = {
        ...formData,
        reading_time: parseInt(formData.reading_time, 10) || 1,
      };

      if (editingArticle) {
        await updateArticle(editingArticle.id, articleData);
        setSuccess("Article mis à jour avec succès !");
      } else {
        await createArticle(articleData);
        setSuccess("Article créé avec succès !");
      }

      closeModal();
      fetchArticles();
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (article) => {
    setError("");
    setSuccess("");
    try {
      await updateArticle(article.id, { published: !article.published });
      setSuccess(article.published ? "Article dépublié." : "Article publié !");
      fetchArticles();
    } catch (err) {
      setError(err.message || "Erreur lors du changement de statut");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteArticle(id);
      setSuccess("Article supprimé avec succès !");
      setDeleteConfirm(null);
      fetchArticles();
    } catch (err) {
      setError(err.message || "Erreur lors de la suppression");
    }
  };

  return (
    <>
      <div className="content-header">
        <h2>Gestion des Articles</h2>
        <button onClick={openCreateModal} className="btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nouvel Article
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement des articles...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l6 6v8a2 2 0 01-2 2zM15 4v4a2 2 0 002 2h4" />
          </svg>
          <h3>Aucun article</h3>
          <p>La routine publiera automatiquement, ou créez un article manuellement</p>
          <button onClick={openCreateModal} className="btn-primary">
            Créer un article
          </button>
        </div>
      ) : (
        <div className="projects-table-container">
          <table className="projects-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Catégorie</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td className="project-name">
                    <strong>{article.title}</strong>
                    <span className="project-slug">/blog/{article.slug}</span>
                  </td>
                  <td>
                    <span className="category-badge">
                      {getCategoryLabel(article.category)}
                    </span>
                  </td>
                  <td>
                    {article.created
                      ? parsePbDate(article.created).toLocaleDateString("fr-FR")
                      : "-"}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => togglePublished(article)}
                      className={`status-badge status-toggle ${
                        article.published ? "completed" : "in-progress"
                      }`}
                      title={article.published ? "Cliquer pour dépublier" : "Cliquer pour publier"}
                    >
                      {article.published ? "Publié" : "Brouillon"}
                    </button>
                  </td>
                  <td className="actions">
                    <button
                      onClick={() => openEditModal(article)}
                      className="btn-icon edit"
                      title="Modifier"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(article.id)}
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

      {/* Modal Formulaire Article */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingArticle ? "Modifier l'article" : "Nouvel article"}</h2>
              <button onClick={closeModal} className="modal-close">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="project-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="article-title">Titre *</label>
                  <input
                    type="text"
                    id="article-title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Titre de l'article"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="article-slug">Slug (URL) *</label>
                  <input
                    type="text"
                    id="article-slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                    pattern="[a-z0-9-]+"
                    title="Minuscules, chiffres et tirets uniquement"
                    placeholder="mon-article"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="article-category">Catégorie</label>
                  <select
                    id="article-category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    {BLOG_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="article-reading-time">Temps de lecture (min)</label>
                  <input
                    type="number"
                    id="article-reading-time"
                    name="reading_time"
                    value={formData.reading_time}
                    onChange={handleInputChange}
                    min="1"
                    max="60"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="article-excerpt">
                  Extrait (meta description) — {formData.excerpt.length}/160
                </label>
                <textarea
                  id="article-excerpt"
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  rows="2"
                  maxLength="500"
                  placeholder="Résumé de l'article en 140-160 caractères..."
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="published"
                    checked={formData.published}
                    onChange={handleInputChange}
                  />
                  <span>Article publié</span>
                </label>
              </div>

              <div className="form-group">
                <label>Contenu *</label>
                <RichTextEditor
                  key={editingArticle?.id || "new-article"}
                  value={formData.content}
                  onChange={(html) =>
                    setFormData((prev) => ({ ...prev, content: html }))
                  }
                />
              </div>

              {/* Tags */}
              <div className="form-group">
                <label>Tags</label>
                <div className="tag-input-wrapper">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Ajouter un tag..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <button type="button" onClick={addTag} className="btn-add">
                    +
                  </button>
                </div>
                <div className="tags-list">
                  {formData.tags.map((tag, i) => (
                    <span key={i} className="tag">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)}>
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Sources */}
              <div className="form-group">
                <label>Sources</label>
                <div className="tag-input-wrapper">
                  <input
                    type="text"
                    value={sourceTitle}
                    onChange={(e) => setSourceTitle(e.target.value)}
                    placeholder="Titre de la source"
                  />
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://..."
                  />
                  <button type="button" onClick={addSource} className="btn-add">
                    +
                  </button>
                </div>
                <div className="tags-list">
                  {formData.sources.map((source, i) => (
                    <span key={i} className="tag">
                      {source.title}
                      <button type="button" onClick={() => removeSource(i)}>
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Enregistrement..." : editingArticle ? "Mettre à jour" : "Créer"}
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
            <p>Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.</p>
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
    </>
  );
};

export default ArticlesPanel;
