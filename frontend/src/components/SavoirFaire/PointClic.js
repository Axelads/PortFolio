import React, { useState } from 'react';
import SCENES from './demos/rolistes/scenes.json';

// Le point & click de RolistesUnis.fr (Runes/frontend/src/components/Adventure), en version légère : les mêmes
// scènes peintes et les mêmes zones tracées à la main, sans framer-motion ni les panneaux du site. Entrer dans
// l'auberge et en ressortir marche comme sur le site ; les autres zones disent ce qu'elles ouvrent là-bas.

const SITE = 'https://www.rolistesunis.fr';
const IMAGES = { exterieur: '/demos/rolistes/vallee.webp', auberge: '/demos/rolistes/auberge.webp' };
// Cadre 16:9 dans chaque peinture : la vallée (panoramique) est montrée à partir de 27 % de sa largeur,
// là où commencent ses zones.
const CADRE = { exterieur: 0.27, auberge: 0 };
const RATIO_SCENE = 16 / 9;

const PAGES = {
  '/events': 'la page des événements',
  '/news': 'les actualités',
  '/about': "la présentation de l'association",
};

function destination(action) {
  switch (action.type) {
    case 'route':
      return PAGES[action.target] ?? 'une page du site';
    case 'modal':
      return 'une fenêtre par-dessus la scène';
    case 'panel':
      return 'le récit de l’aubergiste';
    case 'contact':
      return 'le formulaire de contact';
    case 'scene':
      return 'une autre scène peinte';
    default:
      return 'une page du site';
  }
}

const PointClic = () => {
  const [sceneId, setSceneId] = useState('exterieur');
  const [survol, setSurvol] = useState(null);
  const [bulle, setBulle] = useState(null);

  const agir = (zone) => {
    const { action } = zone;
    if (action.type === 'scene' && SCENES[action.target]) {
      setBulle(null);
      setSurvol(null);
      setSceneId(action.target);
      return;
    }
    if (action.type === 'dice') {
      setBulle({ zone, jet: 1 + Math.floor(Math.random() * 20) });
      return;
    }
    setBulle({ zone });
  };

  return (
    <div className="point-clic" data-scene={sceneId}>
      {Object.values(SCENES).map((scene) => {
        const largeur = Math.max(1, scene.ratio / RATIO_SCENE);
        const active = scene.id === sceneId;
        return (
          <div
            key={scene.id}
            className="point-clic__scene"
            data-active={active ? 'true' : 'false'}
            inert={active ? undefined : ''}
            aria-hidden={active ? undefined : 'true'}
          >
            <div
              className="point-clic__monde"
              style={{ width: `${largeur * 100}%`, transform: `translateX(-${CADRE[scene.id] * 100}%)` }}
            >
              <img src={IMAGES[scene.id]} alt={scene.alt} loading="lazy" decoding="async" />
              <svg className="point-clic__zones" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {scene.hotspots.map((zone) => (
                  <polygon
                    key={zone.id}
                    points={zone.points}
                    data-survol={survol === zone.id ? 'true' : 'false'}
                    onPointerEnter={() => setSurvol(zone.id)}
                    onPointerLeave={() => setSurvol((s) => (s === zone.id ? null : s))}
                    onClick={() => agir(zone)}
                  />
                ))}
              </svg>
              {/* Repères : la même action au clavier et au toucher, avec l'étiquette de la zone. */}
              {scene.hotspots.map((zone) => (
                <button
                  key={zone.id}
                  type="button"
                  className="point-clic__repere"
                  style={{ left: `${zone.marker[0]}%`, top: `${zone.marker[1]}%` }}
                  data-survol={survol === zone.id ? 'true' : 'false'}
                  onPointerEnter={() => setSurvol(zone.id)}
                  onPointerLeave={() => setSurvol((s) => (s === zone.id ? null : s))}
                  onFocus={() => setSurvol(zone.id)}
                  onBlur={() => setSurvol((s) => (s === zone.id ? null : s))}
                  onClick={() => agir(zone)}
                >
                  <span className="point-clic__point" aria-hidden="true" />
                  <span className="point-clic__etiquette">
                    <b>{zone.label}</b>
                    <small>{zone.sublabel}</small>
                  </span>
                </button>
              ))}
            </div>
            <p className="point-clic__lieu" aria-hidden="true">{scene.nom}</p>
          </div>
        );
      })}

      {bulle && (
        <div className="point-clic__bulle" role="status">
          <p>
            <b>{bulle.zone.label}</b>
            {bulle.jet
              ? <> : le dé roule… <strong className="point-clic__jet">{bulle.jet}</strong> sur 20.</>
              : <> : sur le site, « {bulle.zone.sublabel} » ouvre {destination(bulle.zone.action)}.</>}
          </p>
          <div className="point-clic__actions">
            <a href={SITE} target="_blank" rel="noopener noreferrer">Essayer sur rolistesunis.fr</a>
            <button type="button" onClick={() => setBulle(null)}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointClic;
