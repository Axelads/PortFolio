import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FaLinkedin, FaEye, FaHeart, FaComment, FaExternalLinkAlt } from 'react-icons/fa';
import dataLinkedIn from '../../assets/Data/DataLinkedIn.json';

gsap.registerPlugin(ScrollTrigger);

const LinkedInCard = ({ post, index }) => {
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;

    gsap.fromTo(
      card,
      { x: 50, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.6,
        delay: index * 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: card,
          start: "top 90%",
          toggleActions: "play none none none",
        },
      }
    );
  }, [index]);

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <a
      ref={cardRef}
      href={post.postUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="linkedin-card"
    >
      <div className="card-image-wrapper">
        <img src={post.image} alt="Post LinkedIn" className="card-image" />
        <div className="card-overlay">
          <FaExternalLinkAlt className="overlay-icon" />
        </div>
      </div>

      <div className="card-content">
        <span className="card-date">{formatDate(post.date)}</span>
        <p className="card-text">{truncateText(post.content)}</p>

        <div className="card-stats">
          <span className="stat">
            <FaEye className="stat-icon views" />
            {post.views}
          </span>
          {post.likes > 0 && (
            <span className="stat">
              <FaHeart className="stat-icon likes" />
              {post.likes}
            </span>
          )}
          {post.comments > 0 && (
            <span className="stat">
              <FaComment className="stat-icon comments" />
              {post.comments}
            </span>
          )}
        </div>
      </div>
    </a>
  );
};

const LinkedInPosts = () => {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      headerRef.current,
      { y: -30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      }
    );
  }, []);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -350, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 350, behavior: 'smooth' });
    }
  };

  return (
    <section className="linkedin-section" ref={sectionRef}>
      <div className="linkedin-header" ref={headerRef}>
        <div className="header-title">
          <FaLinkedin className="linkedin-icon" />
          <h2>Mon Actualite</h2>
        </div>
        <p className="linkedin-subtitle">Suivez mes dernieres publications sur LinkedIn</p>
        <a
          href={dataLinkedIn.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="profile-link"
        >
          Voir mon profil LinkedIn
          <FaExternalLinkAlt className="link-icon" />
        </a>
      </div>

      <div className="linkedin-carousel-wrapper">
        <button className="scroll-btn scroll-left" onClick={scrollLeft} aria-label="Scroll left">
          <span>&#8249;</span>
        </button>

        <div className="linkedin-carousel" ref={scrollContainerRef}>
          {dataLinkedIn.posts.map((post, index) => (
            <LinkedInCard key={post.id} post={post} index={index} />
          ))}
        </div>

        <button className="scroll-btn scroll-right" onClick={scrollRight} aria-label="Scroll right">
          <span>&#8250;</span>
        </button>
      </div>
    </section>
  );
};

export default LinkedInPosts;
