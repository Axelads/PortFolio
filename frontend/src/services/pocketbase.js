// En développement, utilise le proxy pour éviter les erreurs CORS
const POCKETBASE_URL = process.env.NODE_ENV === 'development'
  ? '/pocketbase'
  : process.env.REACT_APP_POCKETBASE_URL;

const getAuthHeader = () => {
  const token = localStorage.getItem("pb_admin_token");
  return token ? { Authorization: token } : {};
};

// Récupérer tous les projets
export const getProjects = async () => {
  try {
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/projects/records?sort=-created`,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des projets");
    }

    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error("Erreur récupération projets:", error);
    throw error;
  }
};

// Récupérer un projet par son ID
export const getProjectById = async (id) => {
  try {
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/projects/records/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    if (!response.ok) {
      throw new Error("Projet non trouvé");
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur récupération projet:", error);
    throw error;
  }
};

// Récupérer un projet par son slug
export const getProjectBySlug = async (slug) => {
  try {
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/projects/records?filter=(slug='${slug}')`,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération du projet");
    }

    const data = await response.json();
    return data.items[0] || null;
  } catch (error) {
    console.error("Erreur récupération projet:", error);
    throw error;
  }
};

// Créer un nouveau projet
export const createProject = async (projectData) => {
  try {
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/projects/records`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(projectData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erreur lors de la création du projet");
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur création projet:", error);
    throw error;
  }
};

// Mettre à jour un projet
export const updateProject = async (id, projectData) => {
  try {
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/projects/records/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(projectData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erreur lors de la mise à jour du projet");
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur mise à jour projet:", error);
    throw error;
  }
};

// Supprimer un projet
export const deleteProject = async (id) => {
  try {
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/projects/records/${id}`,
      {
        method: "DELETE",
        headers: {
          ...getAuthHeader(),
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erreur lors de la suppression du projet");
    }

    return true;
  } catch (error) {
    console.error("Erreur suppression projet:", error);
    throw error;
  }
};

// Récupérer les projets par catégorie
export const getProjectsByCategory = async (category) => {
  try {
    const filter = category === "all" ? "" : `?filter=(category='${category}')`;
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/projects/records${filter}&sort=-date`,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des projets");
    }

    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error("Erreur récupération projets par catégorie:", error);
    throw error;
  }
};

export { POCKETBASE_URL };
