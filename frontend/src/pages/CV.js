import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { FaDownload, FaArrowLeft } from 'react-icons/fa';
import cv from '../assets/Data/DataCvContent.json';

/*
 * Direction (validée) : « document premium » — deux feuilles A4 posées sur le
 * fond du site (dark/light via var(--*)), papier volontairement clair car
 * WYSIWYG avec l'impression : ce qu'on voit à l'écran = le PDF (window.print,
 * @page A4). Le contenu vit dans DataCvContent.json : mettre à jour le CV =
 * éditer ce JSON, plus jamais de PDF à re-uploader.
 */

const Contact = ({ identity }) => (
  <ul className="cv-contact">
    <li>{identity.phone}</li>
    <li>
      {/* <wbr> après le @ : césure propre dans la colonne étroite */}
      <a href={`mailto:${identity.email}`}>
        {identity.email.split('@')[0]}@<wbr />{identity.email.split('@')[1]}
      </a>
    </li>
    <li>
      <a href={`https://${identity.website}`} target="_blank" rel="noopener noreferrer">
        {identity.website}
      </a>
    </li>
    <li>
      <a href={`https://${identity.github}`} target="_blank" rel="noopener noreferrer">
        {identity.github}
      </a>
    </li>
    <li>
      <a href={`https://${identity.linkedin}`} target="_blank" rel="noopener noreferrer">
        {identity.linkedin}
      </a>
    </li>
  </ul>
);

const SheetFooter = ({ identity, page }) => (
  <footer className="cv-sheet__footer">
    <span>{identity.name} — {identity.title}</span>
    <span>{identity.website}/cv</span>
    <span>{page} / 2</span>
  </footer>
);

// Décor de fond : échos très pâles de l'aurora du site (print-safe)
const CvBackdrop = () => (
  <div className="cv-backdrop" aria-hidden="true">
    <svg className="cv-backdrop__tr" viewBox="0 0 420 300" fill="none">
      <defs>
        <filter id="cv-blur-a" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
      </defs>
      <g filter="url(#cv-blur-a)">
        <ellipse cx="330" cy="40" rx="150" ry="90" fill="#8bc7b1" opacity="0.16" />
        <ellipse cx="420" cy="150" rx="120" ry="80" fill="#4a90e2" opacity="0.08" />
        <ellipse cx="250" cy="-20" rx="100" ry="70" fill="#8bc7b1" opacity="0.10" />
      </g>
      <path
        d="M120 26 C 210 -6, 300 66, 418 30"
        stroke="#8bc7b1"
        strokeWidth="1.4"
        opacity="0.35"
      />
      <path
        d="M170 60 C 250 30, 330 96, 420 66"
        stroke="#8bc7b1"
        strokeWidth="1"
        opacity="0.22"
      />
    </svg>
    <svg className="cv-backdrop__bl" viewBox="0 0 300 220" fill="none">
      <defs>
        <filter id="cv-blur-b" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="24" />
        </filter>
      </defs>
      <g filter="url(#cv-blur-b)">
        <ellipse cx="-10" cy="190" rx="130" ry="80" fill="#8bc7b1" opacity="0.13" />
        <ellipse cx="90" cy="240" rx="100" ry="60" fill="#4a90e2" opacity="0.06" />
      </g>
      <path
        d="M-10 170 C 70 140, 150 200, 240 172"
        stroke="#8bc7b1"
        strokeWidth="1.2"
        opacity="0.28"
      />
    </svg>
  </div>
);

// Sceau de cire à l'olivier (logo Axel Grégoire pressé dans la cire menthe)
const CvSeal = () => (
  <svg className="cv-seal" viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <radialGradient id="cv-wax" cx="38%" cy="32%" r="75%">
        <stop offset="0%" stopColor="#a8d8c4" />
        <stop offset="45%" stopColor="#8bc7b1" />
        <stop offset="80%" stopColor="#6aa78f" />
        <stop offset="100%" stopColor="#578f79" />
      </radialGradient>
      <filter id="cv-wax-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0b2231" floodOpacity="0.3" />
      </filter>
    </defs>
    <path
      filter="url(#cv-wax-shadow)"
      fill="url(#cv-wax)"
      d="M100 12
         C 126 8, 152 22, 166 42
         C 182 64, 192 88, 184 114
         C 177 138, 162 160, 138 172
         C 116 183, 88 188, 66 176
         C 42 164, 22 144, 16 118
         C 10 92, 18 64, 36 44
         C 52 26, 76 16, 100 12 Z"
    />
    <circle cx="100" cy="99" r="64" fill="#83bfa9" />
    <circle cx="100" cy="99" r="64" fill="none" stroke="#578f79" strokeWidth="2.5" opacity="0.55" />
    <circle cx="100" cy="99" r="58" fill="none" stroke="#c2e2d4" strokeWidth="1.5" opacity="0.7" />
    <image
      href="/images/cv/sceau-olivier.png"
      x="65"
      y="50"
      width="70"
      height="101"
      opacity="0.95"
    />
    <path
      d="M 47 62 A 64 64 0 0 1 130 40"
      fill="none"
      stroke="#d9efe4"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.5"
    />
  </svg>
);

const ProjectEntry = ({ project }) => (
  <li>
    <img
      className="cv-projects__logo"
      src={project.logo}
      alt=""
      width="34"
      height="34"
    />
    <div className="cv-projects__content">
      <div className="cv-projects__head">
        <h3>{project.name}</h3>
        <p className="cv-projects__stack">{project.stack.join(' · ')}</p>
      </div>
      <p className="cv-projects__desc">{project.description}</p>
    </div>
  </li>
);

const ExperienceEntry = ({ entry }) => (
  <article className="cv-xp">
    <div className="cv-xp__head">
      <h3>
        {entry.role}
        <span className="cv-xp__company"> · {entry.company}</span>
      </h3>
      <p className="cv-xp__meta">
        <span>{entry.period}</span>
        <span>{entry.place}</span>
      </p>
    </div>
    <ul>
      {entry.bullets.map((b) => (
        <li key={b}>{b}</li>
      ))}
    </ul>
  </article>
);

const CV = () => {
  const { identity, meta } = cv;

  return (
    <div className="cv-page">
      <Helmet>
        <title>CV — Axel Grégoire, Développeur Full Stack JavaScript</title>
        <meta
          name="description"
          content="CV en ligne d'Axel Grégoire, développeur full stack JavaScript (React, Next.js, React Native, Node.js). Consultable en ligne et téléchargeable en PDF, toujours à jour."
        />
        <link rel="canonical" href="https://axelgregoire.fr/cv" />
      </Helmet>

      <div className="cv-page__chrome">
        <Link to="/" className="cv-page__back">
          <FaArrowLeft aria-hidden="true" /> Portfolio
        </Link>
        <div className="cv-page__actions">
          <p className="cv-page__hint">
            Version en ligne, toujours à jour — choisis « Enregistrer au format PDF » dans la fenêtre d'impression.
          </p>
          <button type="button" className="cv-page__download" onClick={() => window.print()}>
            <FaDownload aria-hidden="true" /> Télécharger en PDF
          </button>
        </div>
      </div>

      <div className="cv-page__paper">
        {/* ------------------------------- Page 1 ------------------------------- */}
        <section className="cv-sheet" aria-label="CV, page 1 : profil développeur">
          <CvBackdrop />
          <header className="cv-head">
            <div className="cv-head__id">
              <h1>{identity.name}</h1>
              <p className="cv-head__title">{identity.title}</p>
              <p className="cv-head__subtitle">{identity.subtitle}</p>
            </div>
            <p className="cv-head__edition">
              <span>{meta.edition}</span>
              <span>{identity.location}</span>
            </p>
          </header>

          <div className="cv-sheet__body">
            <div className="cv-main">
              <p className="cv-pitch">{cv.pitch}</p>

              <h2 className="cv-section-title">Expérience développeur</h2>
              {cv.experienceDev.map((entry) => (
                <ExperienceEntry key={entry.company} entry={entry} />
              ))}

              <h2 className="cv-section-title">Projets phares</h2>
              <ul className="cv-projects">
                {cv.projects.map((project) => (
                  <ProjectEntry key={project.name} project={project} />
                ))}
              </ul>
            </div>

            <aside className="cv-side">
              <h2 className="cv-section-title">Contact</h2>
              <Contact identity={identity} />

              <h2 className="cv-section-title">Compétences</h2>
              {cv.skills.map((group) => (
                <div className="cv-skills" key={group.group}>
                  <h3>{group.group}</h3>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}

              <h2 className="cv-section-title">Atouts</h2>
              <ul className="cv-strengths">
                {cv.strengths.map((s) => (
                  <li key={s.title}>
                    <h3>{s.title}</h3>
                    <p>{s.detail}</p>
                  </li>
                ))}
              </ul>
            </aside>
          </div>

          <CvSeal />
          <SheetFooter identity={identity} page={1} />
        </section>

        {/* ------------------------------- Page 2 ------------------------------- */}
        <section className="cv-sheet" aria-label="CV, page 2 : parcours et formation">
          <CvBackdrop />
          <header className="cv-head cv-head--compact">
            <div className="cv-head__id">
              <p className="cv-head__name-small">{identity.name}</p>
              <h2 className="cv-head__title">Parcours &amp; formation</h2>
            </div>
            <p className="cv-head__edition">
              <span>{meta.edition}</span>
            </p>
          </header>

          <div className="cv-sheet__body">
            <div className="cv-main">
              <h2 className="cv-section-title cv-section-title--first">Projets phares — suite</h2>
              <ul className="cv-projects">
                {cv.projectsSuite.map((project) => (
                  <ProjectEntry key={project.name} project={project} />
                ))}
              </ul>

              <p className="cv-pitch cv-pitch--page2">{cv.reconversionIntro}</p>

              <h2 className="cv-section-title">Avant le code — quinze ans de terrain</h2>
              {cv.careerBefore.map((entry) => (
                <ExperienceEntry key={entry.company} entry={entry} />
              ))}

              <p className="cv-closing">{cv.closing}</p>
            </div>

            <aside className="cv-side">
              <h2 className="cv-section-title">Formation</h2>
              <ul className="cv-education">
                {cv.education.map((item) => (
                  <li key={item.diploma}>
                    <h3>{item.diploma}</h3>
                    <p>
                      <span>{item.school}</span>
                      <span>{item.period}</span>
                    </p>
                  </li>
                ))}
              </ul>

              <h2 className="cv-section-title">Langues</h2>
              <ul className="cv-languages">
                {cv.languages.map((lang) => (
                  <li key={lang.name}>
                    <span>{lang.name}</span> — {lang.level}
                  </li>
                ))}
              </ul>

              <h2 className="cv-section-title">Passions</h2>
              <ul className="cv-interests">
                {cv.interests.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </aside>
          </div>

          <CvSeal />
          <SheetFooter identity={identity} page={2} />
        </section>
      </div>
    </div>
  );
};

export default CV;
