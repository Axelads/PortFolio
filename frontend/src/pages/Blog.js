import React, { useCallback, useEffect, useRef, useState } from "react";
import Seo, { SITE_URL } from "../components/Seo";
import { gsap } from "gsap";
import ArticleCard from "../components/Blog/ArticleCard";
// Avatar dessiné d'Axel, expression « réflexion » (planche d'expressions v3, détourée).
import avatarReflexion from "../images/avatar/avatar-reflexion.webp";
import { getArticles, BLOG_CATEGORIES } from "../services/blog";

const FILTERS = [{ id: "all", label: "Tous" }, ...BLOG_CATEGORIES];

const BLOG_LD = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "Blog d'Axel Grégoire",
  url: `${SITE_URL}/blog`,
  description: "Veille technique en français sur React, CSS, JavaScript, les outils et l'IA.",
  inLanguage: "fr",
  author: { "@type": "Person", name: "Axel Grégoire", url: SITE_URL },
};

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const Blog = () => {
  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const pageRef = useRef(null);
  const cardsRef = useRef([]);
  const animatedCountRef = useRef(0);

  const fetchPage = useCallback(async (pageNum, category, append) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      const data = await getArticles({ page: pageNum, category });
      setArticles((prev) => (append ? [...prev, ...data.items] : data.items));
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
    } catch (err) {
      setError("Impossible de charger les articles pour le moment.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    cardsRef.current = [];
    animatedCountRef.current = 0;
    fetchPage(1, activeCategory, false);
  }, [activeCategory, fetchPage]);

  // Entrée du hero (une seule fois)
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".blog-hero",
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      );
    }, pageRef);
    return () => ctx.revert();
  }, []);

  // Reveal des cartes : uniquement les nouvelles (pagination "Charger plus")
  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean).slice(animatedCountRef.current);
    if (cards.length === 0) return;
    animatedCountRef.current += cards.length;
    if (prefersReducedMotion()) return;
    gsap.fromTo(
      cards,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", stagger: 0.08, clearProps: "all" }
    );
  }, [articles]);

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      fetchPage(page + 1, activeCategory, true);
    }
  };

  return (
    <div className="blog-page" ref={pageRef}>
      <Seo
        title="Blog dev : React, CSS, JavaScript et IA | Axel Grégoire"
        description="Veille technique en français sur React, CSS, JavaScript, les outils et l'IA, avec du code. Un nouvel article chaque semaine."
        path="/blog"
        jsonLd={BLOG_LD}
      />

      <header className="blog-hero">
        <img className="blog-hero__avatar" src={avatarReflexion} alt="" width="183" height="256" />
        <h1>Blog</h1>
        <p className="blog-hero__intro">
          Ma veille technique, en articles clairs et concrets&nbsp;: IA, JavaScript,
          React, CSS et outils du quotidien de développeur.
        </p>
      </header>

      <div className="blog-filters" role="tablist" aria-label="Filtrer par catégorie">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={`blog-pill ${activeCategory === filter.id ? "is-active" : ""}`}
            onClick={() => setActiveCategory(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="blog-state">
          <p>Chargement des articles...</p>
        </div>
      )}

      {!loading && error && (
        <div className="blog-state">
          <p>{error}</p>
          <button
            type="button"
            className="blog-state__retry"
            onClick={() => fetchPage(1, activeCategory, false)}
          >
            Réessayer
          </button>
        </div>
      )}

      {!loading && !error && articles.length === 0 && (
        <div className="blog-state">
          <p>Aucun article pour le moment. Revenez bientôt&nbsp;!</p>
        </div>
      )}

      {!loading && !error && articles.length > 0 && (
        <>
          <p className="blog-count">
            {totalItems} article{totalItems > 1 ? "s" : ""}
          </p>
          <div className="articles-grid">
            {articles.map((article, index) => (
              <ArticleCard
                key={article.id}
                article={article}
                innerRef={(el) => (cardsRef.current[index] = el)}
              />
            ))}
          </div>
          {page < totalPages && (
            <button
              type="button"
              className="load-more"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? "Chargement..." : "Charger plus d'articles"}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default Blog;
