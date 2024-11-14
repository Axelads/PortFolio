import React, { useEffect, useState } from 'react';
import './Skills.scss';

const Skills = () => {
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5001/api/skills')
      .then((response) => response.json())
      .then((data) => setSkills(data))
      .catch((error) => console.error('Erreur lors de la récupération des compétences:', error));
  }, []);

  return (
    <div className="skills-container">
      <h2>Mes compétences</h2>
      <div className="skills-list">
        {skills.map((skill) => (
          <div key={skill.name} className="skill">
            <img src={skill.urlImage} alt={`${skill.name} logo`} className="skill-image" />
            <div className={`progress-bar ${skill.status === 'Completed' ? 'completed' : 'in-progress'}`}>
              <div className="progress" style={{ width: `${skill.level}%` }}>
                {skill.status === 'Completed' ? 'Completed' : 'En cours...'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Skills;