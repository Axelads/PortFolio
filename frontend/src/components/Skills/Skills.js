import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import dataSkills from '../../assets/Data/DataSkills.json';
import SkillIcon from './skillIcons';

gsap.registerPlugin(ScrollTrigger);

// « La stack que j'utilise vraiment » : six outils au cœur des projets, chacun ancré dans des projets réels, puis le
// reste en étiquettes rangées par domaine. Épurée le 20/11/2026 (compte rendu d'Axel) : 37 tuiles, légende à trois
// niveaux, filtres et jauges remplacés par ces deux étages.

const TITRE = ['La', 'stack', 'que', "j'utilise"];

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const Skills = () => {
  const sectionRef = useRef(null);
  const coeur = dataSkills.skills.filter((skill) => skill.hero);
  const { domaines } = dataSkills;

  // Entrée au défilement : titre mot à mot, puis les cartes et les domaines par lots.
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: { trigger: '.skills-header', start: 'top 80%', toggleActions: 'play none none none' },
      })
        .fromTo('.skills-title .word > span', { yPercent: 110 }, { yPercent: 0, duration: 0.8, stagger: 0.06, ease: 'expo.out' })
        .fromTo('.skills-lede', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.5');

      ScrollTrigger.batch('.skill-carte, .skills-domaine', {
        start: 'top 92%',
        once: true,
        onEnter: (elements) =>
          gsap.fromTo(
            elements,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.06, clearProps: 'all' },
          ),
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="skills-section" ref={sectionRef} aria-labelledby="skills-title">
      <header className="skills-header">
        <h2 className="skills-title" id="skills-title">
          {TITRE.map((mot) => (
            <span className="word" key={mot}><span>{mot}</span></span>
          ))}
          <span className="word"><span><em>vraiment.</em></span></span>
        </h2>
        <p className="skills-lede">
          Six outils au cœur de chaque projet, tous en JavaScript, puis le reste rangé par domaine. Pas de
          pourcentages&nbsp;: ce que j'utilise en production.
        </p>
      </header>

      <div className="skills-coeur">
        {coeur.map((skill) => (
          <article className="skill-carte" key={skill.id}>
            <SkillIcon name={skill.icon} className="skill-carte__logo" />
            <h3>{skill.name}</h3>
            <p>{skill.why}</p>
          </article>
        ))}
      </div>

      <dl className="skills-domaines">
        {domaines.map((domaine) => (
          <div className="skills-domaine" key={domaine.nom}>
            <dt>{domaine.nom}</dt>
            <dd>
              <ul>
                {domaine.technos.map((techno) => <li key={techno}>{techno}</li>)}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

export default Skills;
