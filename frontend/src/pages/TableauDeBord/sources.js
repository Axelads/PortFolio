import { useEffect, useRef, useState } from 'react';

/**
 * Source de données chargée à part, sans bloquer l'affichage (vérification en direct, activité GitHub…).
 * Rechargée quand `declencheur` change (changement d'écran) et que la dernière lecture a plus de `fraicheurMs`.
 * Renvoie null (en cours), 'erreur', ou la réponse de l'API (avec `verifieLe`, ou `branche: false`).
 */
export function useSource(appeler, chemin, { actif, declencheur, fraicheurMs, onSessionExpiree }) {
  const [donnees, setDonnees] = useState(null);
  const enCours = useRef(false);

  useEffect(() => {
    if (!actif) {
      setDonnees(null);
      return;
    }
    if (enCours.current) return;
    const fraiche = donnees && donnees !== 'erreur' && (!donnees.verifieLe || Date.now() - donnees.verifieLe < fraicheurMs);
    if (fraiche) return;
    enCours.current = true;
    appeler(chemin)
      .then(({ statut, json }) => {
        if (statut === 401) return onSessionExpiree();
        return setDonnees(statut === 200 ? json : 'erreur');
      })
      .catch(() => setDonnees('erreur'))
      .finally(() => {
        enCours.current = false;
      });
  }, [actif, declencheur, donnees, appeler, chemin, fraicheurMs, onSessionExpiree]);

  return donnees;
}
