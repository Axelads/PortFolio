import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import dataSkills from '../../assets/Data/DataSkills.json';

gsap.registerPlugin(ScrollTrigger);

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
        delay: index * 0.1,
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
        delay: index * 0.1 + 0.3,
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
        delay: index * 0.1 + 0.3,
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

  const completedSkills = dataSkills.filter(s => s.status === 'Completed');
  const inProgressSkills = dataSkills.filter(s => s.status !== 'Completed');

  return (
    <section className="skills-section" ref={skillsRef}>
      <div className="skills-header" ref={headerRef}>
        <h2>Mes Compétences</h2>
        <p className="skills-subtitle">Technologies et outils que je maîtrise</p>
      </div>

      <div className="skills-group">
        <div className="group-header">
          <h3>Maîtrisées</h3>
          <span className="group-count">{completedSkills.length}</span>
        </div>
        <div className="skills-grid">
          {completedSkills.map((skill, index) => (
            <SkillCard key={skill._id.$oid} skill={skill} index={index} />
          ))}
        </div>
      </div>

      {inProgressSkills.length > 0 && (
        <div className="skills-group">
          <div className="group-header">
            <h3>En apprentissage</h3>
            <span className="group-count">{inProgressSkills.length}</span>
          </div>
          <div className="skills-grid">
            {inProgressSkills.map((skill, index) => (
              <SkillCard key={skill._id.$oid} skill={skill} index={index + completedSkills.length} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default Skills;
