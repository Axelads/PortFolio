import React from 'react';

const SkillProjects = ({ skills }) => {
  if (!skills || skills.length === 0) {
    return null; // Ne rien afficher si aucune compétence
  }

  return (
    <div className="skill-projects">
      {skills.map((skill, index) => (
        <span key={index} className={`skill skill-${skill.toLowerCase().replace(/\s+/g, '-')}`}>
          {skill}
        </span>
      ))}
    </div>
  );
};

export default SkillProjects;
