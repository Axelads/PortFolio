import React from 'react';
import dataSkills from '../../assets/Data/DataSkills.json';

const PRIORITY_IDS = ['javascript', 'react', 'nextjs'];

const PrioritySkills = () => {
  const prioritySkills = PRIORITY_IDS
    .map(id => dataSkills.skills.find(skill => skill.id === id))
    .filter(skill => skill && skill.urlImage);

  return (
    <div className="priority-skills">
      {prioritySkills.map(skill => (
        <img
          key={skill.id}
          src={skill.urlImage}
          alt={skill.name}
          title={skill.name}
          className="priority-skills__logo"
        />
      ))}
    </div>
  );
};

export default PrioritySkills;
