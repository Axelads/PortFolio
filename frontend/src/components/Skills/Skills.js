import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import dataSkills from '../../assets/Data/DataSkills.json'; // Chemin vers le fichier JSON

gsap.registerPlugin(ScrollTrigger);

const Skills = () => {
  const skillsRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      skillsRef.current,
      { y: -100, opacity: 0 }, // Départ en haut et invisible
      {
        y: 0,
        opacity: 1,
        duration: 1.4,
        ease: "power2.out",
        scrollTrigger: {
          trigger: skillsRef.current,
          start: "top 80%", // ✅ Déclenche l’animation lorsque 10% du composant est visible
          toggleActions: "play none none none",
        },
      }
    );
  }, []);

  return (
    <div className="skills-container" ref={skillsRef}>
      <h2>Mes compétences</h2>
      <div className="skills-list">
        {dataSkills.map((skill) => (
          <div key={skill._id.$oid} className="skill">
            <img src={skill.urlImage} alt={`${skill.name} logo`} title={skill.name} className="skill-image" />
            <div className={`progress-bar ${skill.status === 'Completed' ? 'completed' : 'in-progress'}`}>
              <div className="progress" style={{ width: `${skill.level}%` }}>
                {skill.status === 'Completed' ? 'Completed' : 'En cours...' }
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Skills;
