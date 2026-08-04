import { POCKETBASE_URL, getAuthHeader, parsePbError } from "./pocketbase";

// Catégories du blog — doivent rester alignées avec le select PocketBase
// (chatbot-api/scripts/setup-blog-collection.js) et le prompt de la routine.
export const BLOG_CATEGORIES = [
  { id: "ia", label: "IA" },
  { id: "javascript", label: "JavaScript" },
  { id: "react", label: "React" },
  { id: "css", label: "CSS" },
  { id: "outils", label: "Outils" },
];

export const getCategoryLabel = (id) => {
  const category = BLOG_CATEGORIES.find((cat) => cat.id === id);
  return category ? category.label : id;
};

// Les dates PocketBase utilisent un ESPACE ("YYYY-MM-DD HH:mm:ss.sssZ")
export const parsePbDate = (str) => new Date(String(str || "").replace(" ", "T"));

// Liste publique paginée (uniquement les articles publiés)
export const getArticles = async ({ page = 1, perPage = 9, category } = {}) => {
  try {
    const filter =
      category && category !== "all"
        ? `(published = true && category = '${category}')`
        : "(published = true)";
    const params = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      sort: "-created",
      filter,
    });
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/articles/records?${params.toString()}`,
      { headers: { "Content-Type": "application/json" } }
    );

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des articles");
    }

    const data = await response.json();
    return {
      items: data.items,
      page: data.page,
      totalPages: data.totalPages,
      totalItems: data.totalItems,
    };
  } catch (error) {
    console.error("Erreur récupération articles:", error);
    throw error;
  }
};

// Récupérer un article publié par son slug
export const getArticleBySlug = async (slug) => {
  try {
    const filter = encodeURIComponent(`(slug='${slug}' && published = true)`);
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/articles/records?filter=${filter}&perPage=1`,
      { headers: { "Content-Type": "application/json" } }
    );

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération de l'article");
    }

    const data = await response.json();
    return data.items[0] || null;
  } catch (error) {
    console.error("Erreur récupération article:", error);
    throw error;
  }
};

// ----- Admin (brouillons visibles grâce au token) -----

export const getAllArticlesAdmin = async () => {
  try {
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/articles/records?sort=-created&perPage=200`,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des articles");
    }

    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error("Erreur récupération articles admin:", error);
    throw error;
  }
};

export const createArticle = async (articleData) => {
  try {
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/articles/records`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(articleData),
      }
    );

    if (!response.ok) {
      throw await parsePbError(response, "Erreur lors de la création de l'article");
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur création article:", error);
    throw error;
  }
};

export const updateArticle = async (id, articleData) => {
  try {
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/articles/records/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(articleData),
      }
    );

    if (!response.ok) {
      throw await parsePbError(response, "Erreur lors de la mise à jour de l'article");
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur mise à jour article:", error);
    throw error;
  }
};

export const deleteArticle = async (id) => {
  try {
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/articles/records/${id}`,
      {
        method: "DELETE",
        headers: {
          ...getAuthHeader(),
        },
      }
    );

    if (!response.ok) {
      throw await parsePbError(response, "Erreur lors de la suppression de l'article");
    }

    return true;
  } catch (error) {
    console.error("Erreur suppression article:", error);
    throw error;
  }
};
