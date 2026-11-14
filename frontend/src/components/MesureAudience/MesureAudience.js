import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { envoyerMesure, mesurerAction } from './mesure';

const FICHIER = /\.(pdf|zip|docx?|xlsx?|pptx?|csv|ics|apk)$/i;

/** Ce qu'un clic sur un lien apprend : sortie vers un autre site, e-mail, téléphone, téléchargement. Sinon null. */
function decrireLien(lien) {
  const href = lien.getAttribute('href') || '';
  if (href.startsWith('mailto:')) return { action: 'email', cible: href.split('?')[0] };
  if (href.startsWith('tel:')) return { action: 'telephone', cible: href };
  try {
    const u = new URL(lien.href, window.location.href);
    if (!/^https?:$/.test(u.protocol)) return null;
    if (u.origin !== window.location.origin) return { action: 'sortant', cible: `${u.origin}${u.pathname}` };
    if (FICHIER.test(u.pathname)) return { action: 'fichier', cible: u.pathname };
  } catch {
    return null;
  }
  return null;
}

/**
 * Mesure de fréquentation, sans rendu : une page vue à chaque changement de page (la première porte le site d'origine
 * et les paramètres de campagne utm_*), et les clics qui quittent le site, écrivent, appellent ou téléchargent.
 * Monté une fois dans App.js, pour le site public seulement.
 */
export default function MesureAudience() {
  const { pathname } = useLocation();
  const precedent = useRef(null);

  useEffect(() => {
    if (precedent.current === pathname) return;
    const premiere = precedent.current === null;
    // Les pages suivantes portent l'adresse de la page précédente : l'API la classe « interne » (même visite).
    const origine = premiere ? document.referrer : `${window.location.origin}${precedent.current}`;
    precedent.current = pathname;
    const q = premiere ? new URLSearchParams(window.location.search) : null;
    const utm = q && q.get('utm_source') ? { s: q.get('utm_source'), m: q.get('utm_medium') || '', c: q.get('utm_campaign') || '' } : undefined;
    envoyerMesure({ t: 'page', c: pathname, r: origine, u: utm });
  }, [pathname]);

  useEffect(() => {
    const surClic = (e) => {
      const lien = e.target.closest?.('a[href]');
      if (!lien) return;
      const d = decrireLien(lien);
      if (d) mesurerAction(d.action, (lien.textContent || lien.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim(), d.cible);
    };
    // Phase de capture : avant qu'un gestionnaire du composant n'arrête la propagation. auxclick = clic du milieu.
    document.addEventListener('click', surClic, true);
    document.addEventListener('auxclick', surClic, true);
    return () => {
      document.removeEventListener('click', surClic, true);
      document.removeEventListener('auxclick', surClic, true);
    };
  }, []);

  return null;
}
