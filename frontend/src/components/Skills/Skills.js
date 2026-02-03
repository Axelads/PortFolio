import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FaCode, FaReact, FaPalette, FaPlay, FaDatabase, FaTools, FaCloud } from 'react-icons/fa';
import dataSkills from '../../assets/Data/DataSkills.json';

gsap.registerPlugin(ScrollTrigger);

// Map des icônes
const iconMap = {
  FaCode: FaCode,
  FaReact: FaReact,
  FaPalette: FaPalette,
  FaPlay: FaPlay,
  FaDatabase: FaDatabase,
  FaTools: FaTools,
  FaCloud: FaCloud,
};

const SkillCard = ({ skill, index }) => {
  const cardRef = useRef(null);
  const circleRef = useRef(null);
  const percentRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    const circle = circleRef.current;
    const percent = percentRef.current;

    // Animation d'entrée de la carte
    gsap.fromTo(
      card,
      { y: 50, opacity: 0, scale: 0.9 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        delay: index * 0.05,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: card,
          start: "top 90%",
          toggleActions: "play none none none",
        },
      }
    );

    // Animation du cercle de progression
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (skill.level / 100) * circumference;

    gsap.fromTo(
      circle,
      { strokeDashoffset: circumference },
      {
        strokeDashoffset: offset,
        duration: 1.5,
        delay: index * 0.05 + 0.3,
        ease: "power2.out",
        scrollTrigger: {
          trigger: card,
          start: "top 90%",
          toggleActions: "play none none none",
        },
      }
    );

    // Animation du pourcentage
    gsap.fromTo(
      percent,
      { innerText: 0 },
      {
        innerText: skill.level,
        duration: 1.5,
        delay: index * 0.05 + 0.3,
        ease: "power2.out",
        snap: { innerText: 1 },
        scrollTrigger: {
          trigger: card,
          start: "top 90%",
          toggleActions: "play none none none",
        },
      }
    );
  }, [index, skill.level]);

  const isCompleted = skill.status === 'Completed';
  const circumference = 2 * Math.PI * 45;

  return (
    <div ref={cardRef} className={`skill-card ${isCompleted ? 'completed' : 'in-progress'}`}>
      <div className="skill-visual">
        <svg className="progress-ring" viewBox="0 0 100 100">
          <circle
            className="progress-ring-bg"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="6"
          />
          <circle
            ref={circleRef}
            className="progress-ring-circle"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="skill-icon-wrapper">
          <img src={skill.urlImage} alt={skill.name} className="skill-icon" />
        </div>
      </div>

      <div className="skill-info">
        <h3 className="skill-name">{skill.name}</h3>
        <div className="skill-level">
          <span ref={percentRef} className="skill-percent">0</span>
          <span className="percent-symbol">%</span>
        </div>
        <span className={`skill-status ${isCompleted ? 'status-completed' : 'status-progress'}`}>
          {isCompleted ? 'Maîtrisé' : 'En cours'}
        </span>
      </div>
    </div>
  );
};

const CategorySection = ({ category, startIndex }) => {
  const IconComponent = iconMap[category.icon] || FaCode;

  return (
    <div className="skills-category">
      <div className="category-header">
        <IconComponent className="category-icon" />
        <h3 className="category-title">{category.name}</h3>
        <span className="category-count">{category.skills.length}</span>
      </div>
      <div className="skills-grid">
        {category.skills.map((skill, index) => (
          <SkillCard
            key={skill.id}
            skill={skill}
            index={startIndex + index}
          />
        ))}
      </div>
    </div>
  );
};

const Skills = () => {
  const skillsRef = useRef(null);
  const headerRef = useRef(null);

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
          trigger: skillsRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      }
    );
  }, []);

  // Calculer le nombre total de skills
  const totalSkills = dataSkills.categories.reduce(
    (acc, cat) => acc + cat.skills.length,
    0
  );

  // Calculer l'index de départ pour chaque catégorie
  let currentIndex = 0;

  return (
    <section className="skills-section" ref={skillsRef}>
      <div className="skills-header" ref={headerRef}>
        <h2>Mes Compétences</h2>
        <p className="skills-subtitle">Technologies et outils que je maîtrise</p>
        <div className="skills-stats">
          <span className="stats-number">{totalSkills}</span>
          <span className="stats-label">compétences</span>
        </div>
      </div>

      <div className="skills-categories">
        {dataSkills.categories.map((category) => {
          const section = (
            <CategorySection
              key={category.id}
              category={category}
              startIndex={currentIndex}
            />
          );
          currentIndex += category.skills.length;
          return section;
        })}
      </div>
    </section>
  );
};

export default Skills;
