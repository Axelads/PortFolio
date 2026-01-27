// src/assets/pages/Carte.js
import React from 'react';


const Carte = () => {
  return (
    <div className="carte-wrapper">
      <div className="carte-bg">
        <div className="code-container">
          <div className="ligne"><span className="keyword">const</span> <span className="keyConst">businessCard</span> <span className="operator">=</span> <span className="brace">&#123;</span></div>
          <div className="ligne">  <span className="key">name</span>: <span className="string">"Grégoire Axel"</span>,</div>
          <div className="ligne">  <span className="key">title</span>: <span className="string">"Développeur d'API JavaScript | TypeScript"</span>,</div>
          <div className="ligne">  <span className="key">email</span>: <a href="https://mail.google.com/mail/?view=cm&fs=1&to=professionnel.agregoire@gmail.com" target="_blank" rel="noopener noreferrer"><span className="string">"professionnel.agregoire@gmail.com"</span></a>,</div>
          <div className="ligne">  <span className="key">portfolio</span>: <a href="https://axelgregoire.fr" target="_blank" rel="noopener noreferrer"><span className="string">"axelgregoire.fr"</span></a>,</div>
          <div className="ligne">  <span className="key">description</span>: <span className="string">"Développeur front-end passionné par les dernières technologies."</span>,</div>
          <div className="ligne">  <span className="key">socials</span>: <span className="brace">&#123;</span></div>
          <div className="ligne socials">
            <a href="https://www.linkedin.com/in/axelgregoire" target="_blank" rel="noopener noreferrer">
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg" alt="LinkedIn" />
            </a>
            <a href="https://github.com/Axelads" target="_blank" rel="noopener noreferrer">
                <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg" alt="GitHub" style={{ filter: "invert(100%)" }} />
            </a>
          </div>
          <div className="ligne">  <span className="brace">&#125;</span></div>
          <div className="ligne"><span className="brace">&#125;</span></div>
        </div>
      </div>
    </div>
  );
};

export default Carte;
