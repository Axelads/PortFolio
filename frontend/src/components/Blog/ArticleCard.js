import React from "react";
import { Link } from "react-router-dom";
import ArticleCover from "./ArticleCover";
import { getCategoryLabel, parsePbDate } from "../../services/blog";

export const formatArticleDate = (created) =>
  parsePbDate(created).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

// Vraie balise <a> (Link) : crawlable et accessible, contrairement aux
// cartes role="button" des projets.
const ArticleCard = ({ article, innerRef }) => (
  <Link to={`/blog/${article.slug}`} className="article-card" ref={innerRef}>
    <ArticleCover category={article.category} />
    <div className="article-card__content">
      <div className="article-card__meta">
        <span className="article-chip">{getCategoryLabel(article.category)}</span>
        <span className="article-card__date">{formatArticleDate(article.created)}</span>
        {article.reading_time > 0 && (
          <span className="article-card__time">{article.reading_time} min</span>
        )}
      </div>
      <h3 className="article-card__title">{article.title}</h3>
      {article.excerpt && <p className="article-card__excerpt">{article.excerpt}</p>}
      <span className="article-card__cta">Lire l'article →</span>
    </div>
  </Link>
);

export default ArticleCard;
