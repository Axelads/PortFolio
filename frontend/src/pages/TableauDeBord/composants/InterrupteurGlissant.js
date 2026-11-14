import React from 'react';

/**
 * Interrupteur glissant maison (skill « interrupteur-glissant », assets/InterrupteurGlissant.jsx), en variante
 * CONTRÔLÉE : l'état vient du parent (`actif`), le composant ne fait que demander la bascule. Styles dans
 * _interrupteur.scss, copiés du skill ; sémantique fixe : rouge à gauche = inactif, vert à droite = actif.
 * Accessibilité conservée : role="switch", aria-checked, aria-label, focus visible, Espace et Entrée.
 */
export default function InterrupteurGlissant({ actif = false, onChangement, libelle, desactive = false }) {
  const basculer = () => {
    if (desactive) return;
    onChangement?.(!actif);
  };
  const gererClavier = (evenement) => {
    if (evenement.key === ' ' || evenement.key === 'Enter') {
      evenement.preventDefault();
      basculer();
    }
  };

  return (
    <div className={`interrupteur-glissant${desactive ? ' est-desactive' : ''}`}>
      <span className={`interrupteur-glissant__diode interrupteur-glissant__diode--gauche${!actif ? ' est-allumee-rouge' : ''}`} />
      <button
        type="button"
        role="switch"
        aria-checked={actif}
        aria-label={libelle}
        disabled={desactive}
        className={`interrupteur-glissant__piste${actif ? ' est-actif' : ''}`}
        onClick={basculer}
        onKeyDown={gererClavier}
      >
        <span className="interrupteur-glissant__bouton">
          <span className="interrupteur-glissant__fente" />
        </span>
      </button>
      <span className={`interrupteur-glissant__diode interrupteur-glissant__diode--droite${actif ? ' est-allumee-verte' : ''}`} />
    </div>
  );
}
