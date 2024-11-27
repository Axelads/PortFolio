import React from 'react';
import dataSkills from '../../assets/Data/DataSkills.json'; // Chemin vers le fichier JSON

const Skills = () => {
  return (
    <div className="skills-container">
      <h2>Mes compétences</h2>
      <div className="skills-list">
        {dataSkills.map((skill) => (
          <div key={skill._id.$oid} className="skill">
            <img src={skill.urlImage} alt={`${skill.name} logo`} title={skill.name} className="skill-image" />
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
