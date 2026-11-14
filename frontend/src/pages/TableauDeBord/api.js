import { useCallback, useRef } from 'react';
import { URL_API_TABLEAU_DE_BORD } from './constantes';

/**
 * Client de l'API du tableau de bord. Le jeton de session vit dans un cookie httpOnly posé par l'API : ce code
 * n'y a jamais accès. Il garde seulement le jeton anti-CSRF, renvoyé en en-tête sur chaque mutation.
 */
export function useClientApi() {
  const jeton = useRef('');
  return useCallback(async (chemin, { methode = 'GET', corps } = {}) => {
    const reponse = await fetch(`${URL_API_TABLEAU_DE_BORD}${chemin}`, {
      method: methode,
      credentials: 'include',
      // Content-Type seulement s'il y a un corps : un POST « JSON » vide est refusé par l'API (400).
      headers: methode === 'GET' ? {} : { ...(corps ? { 'Content-Type': 'application/json' } : {}), 'X-Jeton-CSRF': jeton.current },
      body: corps ? JSON.stringify(corps) : undefined,
    });
    const json = await reponse.json().catch(() => ({}));
    if (json.jeton) jeton.current = json.jeton;
    return { statut: reponse.status, json };
  }, []);
}
