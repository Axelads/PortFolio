import React, { useEffect, useRef, useState, useContext } from 'react';
import { LoadingContext } from '../contexts/LoadingContext';
import '../styles/Loading.scss';

// Intro (0 → 8 s) de la vidéo « CV en mouvement » (video-cv/), sans le son.
// URL stables -> cache navigateur ; nouveau nom de fichier = nouvelle version.
// 720p pour les écrans ≤ 1024 px (≈ 0,55 Mo), 1080p au-delà (≈ 0,9 Mo).
// Un navigateur qui ignore `media` sur <source> prend la première : le 720p.
const VIDEO_720 = '/loading-intro-720.mp4';
const VIDEO_1080 = '/loading-intro-1080.mp4';
const POSTER = '/loading-intro-poster.jpg';
const VIDEO_DURATION_MS = 8000;
// Sur téléphone en portrait, ces deux lignes de la vidéo font ~4 px : on les
// répète en texte sous la bande vidéo, à l'instant où elles entrent dans la
// vidéo (6,5 s), avec la même révélation mot à mot.
const LINES_AT = 6.45;
const SOUS_WORDS = ['Web', '·', 'Mobile', '·', 'Automatisation', 'IA'];

const Loading = () => {
  const [fadeOut, setFadeOut] = useState(false);
  const [showLines, setShowLines] = useState(false);
  const { isFirstLoad, setIsFirstLoad, setSplashFading } = useContext(LoadingContext);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!isFirstLoad) return;
    // L'app shell statique de index.html (#splash-static, même rendu que cet
    // overlay) a fait le premier paint ; maintenant que l'overlay React est
    // monté par-dessus, on le retire.
    document.getElementById('splash-static')?.remove();
    // Lecture refusée (iOS en mode économie d'énergie…) : on ne laisse pas le
    // visiteur devant le poster, on passe directement au site.
    videoRef.current?.play()?.catch(triggerFadeOut);
    const safetyTimer = setTimeout(triggerFadeOut, VIDEO_DURATION_MS + 1500);
    return () => clearTimeout(safetyTimer);
  }, [isFirstLoad]);

  const triggerFadeOut = () => {
    setFadeOut(true);
    setSplashFading(true); // l'app redevient visible sous le fondu
    document.documentElement.classList.remove('splash'); // scrollbar normale
    setTimeout(() => setIsFirstLoad(false), 600);
  };

  if (!isFirstLoad) return null;

  return (
    <div className={`loading-container ${fadeOut ? 'fade-out' : ''}`}>
      <video
        ref={videoRef}
        className="loading-video"
        poster={POSTER}
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        onTimeUpdate={(e) => {
          if (!showLines && e.currentTarget.currentTime >= LINES_AT) setShowLines(true);
        }}
        onEnded={triggerFadeOut}
      >
        <source src={VIDEO_720} type="video/mp4" media="(max-width: 1024px)" />
        <source src={VIDEO_1080} type="video/mp4" />
      </video>
      <div className={`loading-lines ${showLines ? 'is-on' : ''}`} aria-hidden="true">
        <p className="loading-lines__sous">
          {SOUS_WORDS.map((word, i) => (
            <span className="loading-lines__mask" key={i}>
              <span style={{ '--i': i }}>{word}</span>
            </span>
          ))}
        </p>
        <p className="loading-lines__lieu">Freelance — Rougiers (Var) · à distance</p>
      </div>
    </div>
  );
};

export default Loading;
