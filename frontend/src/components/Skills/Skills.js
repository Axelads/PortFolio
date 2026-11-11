import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import dataSkills from '../../assets/Data/DataSkills.json';
import SkillIcon from './skillIcons';

gsap.registerPlugin(ScrollTrigger, Flip);

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasFinePointer = () =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const TIERS = [
  { tier: 3, label: 'Cœur de stack', hint: 'tous les jours, en prod' },
  { tier: 2, label: 'Courant', hint: 'utilisé sur plusieurs projets' },
  { tier: 1, label: 'En exploration', hint: "en cours d'apprentissage" },
];

const TITLE_WORDS = ['La', 'stack', 'que', "j'utilise"];

const Meter = ({ tier }) => (
  <span className="skill-meter" data-tier={tier} aria-hidden="true">
    <i /><i /><i />
  </span>
);

const tierLabel = (tier) => TIERS.find((t) => t.tier === tier)?.label ?? '';

const Skills = () => {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const gridRef = useRef(null);
  const toolsRef = useRef(null);
  const flipStateRef = useRef(null);
  const batchesRef = useRef([]);
  const [activeCategory, setActiveCategory] = useState('all');

  const { categories, skills, tools } = dataSkills;
  const shortName = (id) => categories.find((c) => c.id === id)?.short ?? id;
  const counts = skills.reduce((acc, s) => ({ ...acc, [s.category]: (acc[s.category] || 0) + 1 }), {});

  // Séquence d'entrée au scroll : en-tête (titre mot à mot), pills, puis tuiles et chips en lots.
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: { trigger: headerRef.current, start: 'top 80%', toggleActions: 'play none none none' },
      })
        .fromTo('.skills-eyebrow', { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.5 })
        .fromTo('.skills-title .word > span', { yPercent: 110 }, { yPercent: 0, duration: 0.8, stagger: 0.07, ease: 'expo.out' }, '-=0.3')
        .fromTo('.skills-lede', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.5')
        .fromTo('.skills-legend > li', { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.08 }, '-=0.5')
        .fromTo('.skills-filters button', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, clearProps: 'all' }, '-=0.3');

      const reveal = (selector) =>
        ScrollTrigger.batch(selector, {
          start: 'top 92%',
          once: true,
          onEnter: (els) =>
            gsap.fromTo(
              els.filter((el) => !el.dataset.revealed),
              { opacity: 0, y: 24, scale: 0.97 },
              {
                opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out', stagger: 0.04,
                clearProps: 'all',
                onStart() { els.forEach((el) => { el.dataset.revealed = '1'; }); },
              }
            ),
        });
      batchesRef.current = [...reveal('.skill-tile'), ...reveal('.skill-chip')];
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Spotlight qui suit le pointeur (variables CSS, pas de boucle rAF). Desktop uniquement.
  useEffect(() => {
    if (!hasFinePointer()) return undefined;
    const grid = gridRef.current;
    const onMove = (e) => {
      const tile = e.target.closest('.skill-tile');
      if (!tile) return;
      const r = tile.getBoundingClientRect();
      tile.style.setProperty('--mx', `${e.clientX - r.left}px`);
      tile.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    grid.addEventListener('pointermove', onMove, { passive: true });
    return () => grid.removeEventListener('pointermove', onMove);
  }, []);

  // Moment signature : au changement de filtre, les tuiles se réorganisent en FLIP.
  const selectCategory = (id) => {
    if (id === activeCategory) return;
    if (!prefersReducedMotion()) {
      // Les reveals au scroll ne doivent plus interférer une fois que l'utilisateur filtre.
      batchesRef.current.forEach((st) => st.kill());
      batchesRef.current = [];
      const tiles = gsap.utils.toArray('.skill-tile', gridRef.current);
      tiles.forEach((el) => { el.dataset.revealed = '1'; });
      gsap.set(tiles, { clearProps: 'all' });
      flipStateRef.current = Flip.getState(tiles);
    }
    setActiveCategory(id);
  };

  useLayoutEffect(() => {
    const state = flipStateRef.current;
    if (!state) return undefined;
    flipStateRef.current = null;
    const flip = Flip.from(state, {
      duration: 0.55,
      ease: 'power3.inOut',
      stagger: 0.012,
      absoluteOnLeave: true, // seules les tuiles sortantes quittent le flux : la grille garde sa hauteur
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.92, y: 12 }, { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'power3.out', stagger: 0.03 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.92, duration: 0.28, ease: 'power2.in' }),
      onComplete: () => ScrollTrigger.refresh(),
    });
    return () => flip.kill();
  }, [activeCategory]);

  const isShown = (skill) => activeCategory === 'all' || skill.category === activeCategory;

  return (
    <section className="skills-section" ref={sectionRef} aria-labelledby="skills-title">
      <header className="skills-header" ref={headerRef}>
        <div>
          <p className="skills-eyebrow">Compétences</p>
          <h2 className="skills-title" id="skills-title">
            {TITLE_WORDS.map((word) => (
              <span className="word" key={word}><span>{word}</span></span>
            ))}
            <span className="word"><span><em>vraiment.</em></span></span>
          </h2>
          <p className="skills-lede">
            Pas de pourcentages. Des outils classés par usage réel dans mes projets,
            du cœur de stack à ce que j'explore en ce moment.
          </p>
        </div>
        <ul className="skills-legend" aria-label="Niveaux">
          {TIERS.map((t) => (
            <li key={t.tier}>
              <Meter tier={t.tier} />
              <span><b>{t.label}</b> <small>· {t.hint}</small></span>
            </li>
          ))}
        </ul>
      </header>

      <nav className="skills-filters" aria-label="Filtrer par catégorie">
        <button type="button" aria-pressed={activeCategory === 'all'} onClick={() => selectCategory('all')}>
          Tout <small>{skills.length}</small>
        </button>
        {categories.map((cat) => (
          <button key={cat.id} type="button" aria-pressed={activeCategory === cat.id} onClick={() => selectCategory(cat.id)}>
            {cat.name} <small>{counts[cat.id] || 0}</small>
          </button>
        ))}
      </nav>

      <div className="skills-grid" ref={gridRef}>
        {skills.map((skill) => (
          <article
            key={skill.id}
            className={`skill-tile${skill.hero ? ' is-hero' : ''}${skill.wide ? ' is-wide' : ''}`}
            hidden={!isShown(skill)}
            aria-label={`${skill.name}, ${tierLabel(skill.tier)}`}
          >
            {skill.hero ? (
              <div className="skill-top">
                <div className="skill-txt">
                  <h3 className="skill-name">{skill.name}</h3>
                  <p className="skill-why">{skill.why}</p>
                </div>
                <SkillIcon name={skill.icon} className="skill-logo" />
              </div>
            ) : (
              <SkillIcon name={skill.icon} className="skill-logo" />
            )}
            <div className="skill-txt">
              {!skill.hero && <h3 className="skill-name">{skill.name}</h3>}
              <div className="skill-foot">
                <span className="skill-cat">{shortName(skill.category)}</span>
                <Meter tier={skill.tier} />
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="skills-tools" ref={toolsRef}>
        <span className="skills-tools-label">Aussi dans la boîte à outils</span>
        {tools.map((tool) => (
          <span className="skill-chip" key={tool.name}>
            <SkillIcon name={tool.icon} />
            {tool.name}
          </span>
        ))}
      </div>
    </section>
  );
};

export default Skills;
