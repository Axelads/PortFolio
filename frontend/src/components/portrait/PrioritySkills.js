import React from 'react';
import dataSkills from '../../assets/Data/DataSkills.json';
import javascriptLogo from '../../images/skills/javascript.webp';
import reactLogo from '../../images/skills/react.webp';
import nextjsLogo from '../../images/skills/nextjs.webp';

// Logos couleur servis en local (WebP 96 px, ~1-5 Ko) : les `urlImage` du JSON
// pointaient sur des fichiers distants de 900×900 affichés en 32 px.
const PRIORITY_LOGOS = {
  javascript: javascriptLogo,
  react: reactLogo,
  nextjs: nextjsLogo,
};

const PRIORITY_IDS = ['javascript', 'react', 'nextjs'];

const PrioritySkills = () => {
  const prioritySkills = PRIORITY_IDS
    .map(id => dataSkills.skills.find(skill => skill.id === id))
    .filter(Boolean);

  return (
    <div className="priority-skills">
      {prioritySkills.map(skill => (
        <img
          key={skill.id}
          src={PRIORITY_LOGOS[skill.id]}
          alt={skill.name}
          title={skill.name}
          width="32"
          height="32"
          className="priority-skills__logo"
        />
      ))}
    </div>
  );
};

export default PrioritySkills;
