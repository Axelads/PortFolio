// Supprime les balises HTML pour les meta descriptions SEO
export const stripHtml = (html) => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};
