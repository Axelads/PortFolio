import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import ArticleCard, { formatArticleDate } from "../components/Blog/ArticleCard";
import {
  getArticleBySlug,
  getArticles,
  getCategoryLabel,
  parsePbDate,
} from "../services/blog";
import { stripHtml } from "../utils/seo";

// Whitelist alignée sur le HTML autorisé par la routine de génération
const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: [
    "p", "h2", "h3", "ul", "ol", "li", "strong", "em",
    "a", "pre", "code", "blockquote", "br",
  ],
  ALLOWED_ATTR: ["href", "target", "rel"],
};

const isSafeUrl = (url) => typeof url === "string" && /^https?:\/\//.test(url);

const BlogArticle = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      setError(null);
      setArticle(null);
      setRelated([]);
      try {
        const data = await getArticleBySlug(slug);
        if (data) {
          setArticle(data);
          try {
            const rel = await getArticles({ perPage: 4, category: data.category });
            setRelated(rel.items.filter((a) => a.slug !== data.slug).slice(0, 3));
          } catch {
            // les suggestions sont optionnelles, l'article reste lisible
          }
        } else {
          setError("Article non trouvé");
        }
      } catch (err) {
        console.error("Erreur chargement article:", err);
        setError("Erreur lors du chargement de l'article");
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  // Rediriger vers 404 si erreur ou article non trouvé
  useEffect(() => {
    if (!loading && error) {
      navigate("/404", { replace: true });
    }
  }, [loading, error, navigate]);

  if (loading) {
    return (
      <div className="blog-article">
        <div className="blog-state">
          <p>Chargement de l'article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  const canonical = `https://axelgregoire.fr/blog/${article.slug}`;
  const description = article.excerpt || stripHtml(article.content).substring(0, 160);
  const safeSources = Array.isArray(article.sources)
    ? article.sources.filter((s) => s && typeof s.title === "string" && isSafeUrl(s.url))
    : [];
  const tags = Array.isArray(article.tags) ? article.tags : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description,
    datePublished: parsePbDate(article.created).toISOString(),
    dateModified: parsePbDate(article.updated || article.created).toISOString(),
    inLanguage: "fr",
    author: {
      "@type": "Person",
      name: "Axel Grégoire",
      url: "https://axelgregoire.fr",
    },
    mainEntityOfPage: canonical,
  };

  return (
    <div className="blog-article">
      <Helmet>
        <title>{`${article.title} | Blog Axel Grégoire`}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta
          property="article:published_time"
          content={parsePbDate(article.created).toISOString()}
        />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <Link to="/blog" className="blog-article__back">
        ← Tous les articles
      </Link>

      <header className="blog-article__header">
        <div className="blog-article__meta">
          <span className="article-chip">{getCategoryLabel(article.category)}</span>
          <span>{formatArticleDate(article.created)}</span>
          {article.reading_time > 0 && <span>{article.reading_time} min de lecture</span>}
        </div>
        <h1>{article.title}</h1>
        {tags.length > 0 && (
          <div className="blog-article__tags">
            {tags.map((tag, i) => (
              <span key={i} className="article-tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <div
        className="article-body"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(article.content, SANITIZE_OPTIONS),
        }}
      />

      {safeSources.length > 0 && (
        <section className="article-sources">
          <h2>Sources</h2>
          <ul>
            {safeSources.map((source, i) => (
              <li key={i}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section className="article-related">
          <h2>À lire aussi</h2>
          <div className="articles-grid">
            {related.map((rel) => (
              <ArticleCard key={rel.id} article={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default BlogArticle;
