import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FaArrowRight } from 'react-icons/fa';
import ArticleCard from './ArticleCard';
import { getArticles } from '../../services/blog';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Les trois derniers articles du blog sur l'accueil : jusqu'ici le blog n'était joignable que par le menu.
// Si PocketBase ne répond pas ou que le blog est vide, la section n'existe pas (aucun état de chargement).
const DerniersArticles = () => {
  const [articles, setArticles] = useState([]);
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    let annule = false;
    getArticles({ perPage: 3 })
      .then((data) => {
        if (!annule) setArticles(data.items);
      })
      .catch(() => {});
    return () => {
      annule = true;
    };
  }, []);

  useEffect(() => {
    if (articles.length === 0 || prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { y: -30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', toggleActions: 'play none none none' },
        }
      );
      gsap.fromTo(
        cardsRef.current.filter(Boolean),
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.08,
          clearProps: 'all',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', toggleActions: 'play none none none' },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, [articles]);

  if (articles.length === 0) return null;

  return (
    <section className="derniers-articles" ref={sectionRef} aria-labelledby="derniers-articles-titre">
      <div className="derniers-articles__header" ref={headerRef}>
        <h2 id="derniers-articles-titre">Derniers articles</h2>
        <p>Ma veille technique en articles clairs : React, CSS, JavaScript, outils et IA.</p>
      </div>
      <div className="articles-grid">
        {articles.map((article, index) => (
          <ArticleCard
            key={article.id}
            article={article}
            innerRef={(el) => {
              cardsRef.current[index] = el;
            }}
          />
        ))}
      </div>
      <div className="derniers-articles__suite">
        <Link to="/blog" className="derniers-articles__tous">
          Tous les articles
          <FaArrowRight aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
};

export default DerniersArticles;
