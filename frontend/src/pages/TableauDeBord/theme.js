import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { mouvementReduit } from './outils';

// Thème propre au tableau de bord (indépendant de celui du portfolio) : Sombre par défaut, Clair, ou Auto
// (suit le système). La préférence est un simple confort local : son absence ne casse rien.
const CLE = 'tdb-theme';
const PREFERENCES = ['sombre', 'clair', 'auto'];

const lirePreference = () => {
  try {
    const p = window.localStorage.getItem(CLE);
    return PREFERENCES.includes(p) ? p : 'sombre';
  } catch {
    return 'sombre';
  }
};

export function useThemeTableau() {
  const [preference, setPreference] = useState(lirePreference);
  const [systemeSombre, setSystemeSombre] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true);

  useEffect(() => {
    const requete = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!requete) return undefined;
    const suivre = (e) => setSystemeSombre(e.matches);
    requete.addEventListener('change', suivre);
    return () => requete.removeEventListener('change', suivre);
  }, []);

  /** Bascule avec une révélation circulaire partant du bouton (View Transition), simple changement sinon. */
  const changer = useCallback((suivante, evenement) => {
    const appliquer = () => {
      setPreference(suivante);
      try {
        window.localStorage.setItem(CLE, suivante);
      } catch {
        // stockage indisponible (navigation privée) : la préférence vaut pour cette visite
      }
    };
    if (!document.startViewTransition || mouvementReduit()) return appliquer();
    const cible = evenement?.currentTarget?.getBoundingClientRect?.();
    const racine = document.documentElement;
    racine.style.setProperty('--tdb-vt-x', `${cible ? cible.left + cible.width / 2 : window.innerWidth - 120}px`);
    racine.style.setProperty('--tdb-vt-y', `${cible ? cible.top + cible.height / 2 : 32}px`);
    racine.classList.add('tdb-vt-theme');
    const transition = document.startViewTransition(() => flushSync(appliquer));
    transition.ready.catch(() => {}); // abandonnée : le thème change quand même, sans révélation
    transition.finished.finally(() => racine.classList.remove('tdb-vt-theme'));
    return undefined;
  }, []);

  const theme = preference === 'auto' ? (systemeSombre ? 'sombre' : 'clair') : preference;
  return { preference, theme, changer };
}
