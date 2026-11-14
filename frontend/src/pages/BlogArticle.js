import React, { useEffect, useState } from "react";
import Seo, { SITE_URL, imagePartageBlog, titreArticle } from "../components/Seo";
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
// Avatar dessiné d'Axel (expression « joie »), signature des articles.
import avatarAxel from "../images/avatar/avatar-joie.webp";

// Whitelist alignée sur le HTML autorisé par la routine de génération
const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: [
    "p", "h2", "h3", "ul", "ol", "li", "strong", "em",
    "a", "pre", "code", "blockquote", "br",
  ],
  ALLOWED_ATTR: ["href", "target", "rel"],
};

const isSafeUrl = (url) => typeof url === "string" && /^https?:\/\//.test(url);

// Article injecté par scripts/prerender-seo.mjs dans le HTML de la page
// (<script type="application/json" id="ssr-article">) : premier rendu sans aller-retour PocketBase.
// Lecture sans effet de bord (StrictMode peut appeler l'initialiseur deux fois) ; le nœud est retiré au montage.
const lireArticleSsr = (slug) => {
  const noeud = document.getElementById("ssr-article");
  if (!noeud) return null;
  try {
    const article = JSON.parse(noeud.textContent);
    return article && article.slug === slug ? article : null;
  } catch {
    return null;
  }
};

const BlogArticle = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [articleSsr] = useState(() => lireArticleSsr(slug));
  const [article, setArticle] = useState(articleSsr);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(!articleSsr);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.getElementById("ssr-article")?.remove();
  }, []);

  useEffect(() => {
    let annule = false;
    const fetchArticle = async () => {
      const prechargee = Boolean(articleSsr && articleSsr.slug === slug);
      if (!prechargee) {
        setLoading(true);
        setError(null);
        setArticle(null);
        setRelated([]);
      }
      try {
        const data = prechargee ? articleSsr : await getArticleBySlug(slug);
        if (annule) return;
        if (data) {
          setArticle(data);
          try {
            const rel = await getArticles({ perPage: 4, category: data.category });
            if (!annule) setRelated(rel.items.filter((a) => a.slug !== data.slug).slice(0, 3));
          } catch {
            // les suggestions sont optionnelles, l'article reste lisible
          }
        } else {
          setError("Article non trouvé");
        }
      } catch (err) {
        if (annule) return;
        console.error("Erreur chargement article:", err);
        setError("Erreur lors du chargement de l'article");
      } finally {
        if (!annule) setLoading(false);
      }
    };

    fetchArticle();
    return () => {
      annule = true;
    };
  }, [slug, articleSsr]);

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

  const path = `/blog/${article.slug}`;
  const canonical = `${SITE_URL}${path}`;
  const description = article.excerpt || stripHtml(article.content).substring(0, 160);
  const image = imagePartageBlog(article.category);
  const publie = parsePbDate(article.created).toISOString();
  const modifie = parsePbDate(article.updated || article.created).toISOString();
  const safeSources = Array.isArray(article.sources)
    ? article.sources.filter((s) => s && typeof s.title === "string" && isSafeUrl(s.url))
    : [];
  const tags = Array.isArray(article.tags) ? article.tags : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description,
    image: [image],
    datePublished: publie,
    dateModified: modifie,
    inLanguage: "fr",
    author: { "@type": "Person", name: "Axel Grégoire", url: SITE_URL },
    publisher: { "@type": "Person", name: "Axel Grégoire", url: SITE_URL },
    mainEntityOfPage: canonical,
    articleSection: getCategoryLabel(article.category),
    ...(tags.length > 0 ? { keywords: tags.join(", ") } : {}),
  };
  const filAriane = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: article.title, item: canonical },
    ],
  };

  return (
    <div className="blog-article">
      <Seo
        title={titreArticle(article.title)}
        description={description}
        path={path}
        type="article"
        image={image}
        imageAlt={article.title}
        jsonLd={[jsonLd, filAriane]}
      >
        <meta property="article:published_time" content={publie} />
        <meta property="article:modified_time" content={modifie} />
        <meta property="article:author" content={SITE_URL} />
      </Seo>

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
        <p className="blog-article__auteur">
          <img src={avatarAxel} alt="" width="102" height="128" />
          <span>Axel Grégoire</span>
        </p>
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
