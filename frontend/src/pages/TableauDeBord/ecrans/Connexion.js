import React, { useEffect, useRef, useState } from 'react';
import HublotAurore from '../composants/HublotAurore';
import InterrupteurGlissant from '../composants/InterrupteurGlissant';
import { Bouton, TitreRevele } from '../composants/elements';

const LONGUEUR_CODE = 8;

/**
 * Connexion en deux étapes (maquette « Connexion · identifiants » et « Connexion · code »). Sur un appareil de
 * confiance (interrupteur « Se souvenir », 30 jours), la session reste ouverte tant que l'appareil est mémorisé ; si
 * elle a été fermée entre-temps (bouton « Déconnexion »), l'API la rouvre dès le mot de passe : pas d'étape 2.
 * Le code se saisit dans un seul vrai champ (saisie automatique iOS/Android, collage d'un code entier) ;
 * les 8 cases n'en sont que l'affichage.
 */
const Connexion = ({ etape, occupe, erreur, tentative, onIdentifiants, onCode, onRecommencer }) => {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [seSouvenir, setSeSouvenir] = useState(false);
  const [code, setCode] = useState('');
  const champCode = useRef(null);

  // Un code refusé vide les cases et rend la main au champ.
  useEffect(() => {
    if (tentative > 0) {
      setCode('');
      champCode.current?.focus();
    }
  }, [tentative]);

  const envoyerIdentifiants = async (e) => {
    e.preventDefault();
    await onIdentifiants(email.trim(), motDePasse, seSouvenir);
    setMotDePasse('');
  };
  const envoyerCode = (valeur) => {
    if (valeur.length === LONGUEUR_CODE && !occupe) onCode(valeur);
  };
  const saisirCode = (e) => {
    const valeur = e.target.value.replace(/\D/g, '').slice(0, LONGUEUR_CODE);
    setCode(valeur);
    envoyerCode(valeur);
  };

  return (
    <div className="tdb-connexion">
      <section className="tdb-connexion__carte" aria-labelledby="tdb-connexion-titre" aria-busy={occupe || etape === 'chargement'}>
        <p className="tdb-connexion__marque">
          <HublotAurore apparition />
          Tableau de bord
        </p>

        {etape === 'chargement' && <p className="tdb-connexion__texte">Vérification de la session…</p>}

        {etape === 'identifiants' && (
          <form className="tdb-connexion__formulaire" onSubmit={envoyerIdentifiants} noValidate>
            <p className="tdb-connexion__etape">Étape 1 sur 2</p>
            <TitreRevele texte="Connexion" id="tdb-connexion-titre" className="tdb-connexion__titre" />
            <p className="tdb-connexion__texte">Accès réservé. Ton mot de passe, puis un code reçu par e-mail, sauf sur un appareil de confiance.</p>
            <label className="tdb-champ">
              <span className="tdb-champ__libelle">Adresse e-mail</span>
              <input className="tdb-champ__saisie" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="tdb-champ">
              <span className="tdb-champ__libelle">Mot de passe</span>
              <input className="tdb-champ__saisie" type="password" autoComplete="current-password" required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
            </label>
            {/* Interrupteur maison (skill « interrupteur-glissant »), réduit : le texte à côté est un rappel, le contrôle est l'interrupteur. */}
            <div className="tdb-souvenir">
              <div className="tdb-souvenir__interrupteur">
                <InterrupteurGlissant actif={seSouvenir} onChangement={setSeSouvenir} libelle="Se souvenir de cet appareil : rester connecté pendant 30 jours" desactive={occupe} />
              </div>
              <span className="tdb-souvenir__textes" aria-hidden="true" onClick={() => !occupe && setSeSouvenir((v) => !v)}>
                <span className="tdb-souvenir__titre">Se souvenir de cet appareil</span>
                <span className="tdb-souvenir__detail">Tu restes connecté ici pendant 30 jours : ni mot de passe ni code à retaper.</span>
              </span>
            </div>
            <Bouton type="submit" disabled={occupe || !email || !motDePasse}>
              {occupe ? 'Vérification…' : 'Continuer'}
            </Bouton>
            <p className="tdb-connexion__note">Après 5 essais manqués, l’accès est bloqué 15 minutes.</p>
          </form>
        )}

        {etape === 'code' && (
          <form
            className="tdb-connexion__formulaire"
            onSubmit={(e) => {
              e.preventDefault();
              envoyerCode(code);
            }}
            noValidate
          >
            <p className="tdb-connexion__etape">Étape 2 sur 2</p>
            <TitreRevele texte="Vérification" id="tdb-connexion-titre" className="tdb-connexion__titre" />
            <p className="tdb-connexion__texte" id="tdb-code-aide">
              Un code à 8 chiffres vient d’être envoyé par e-mail. Il expire dans 5 minutes.
            </p>
            <label className={`tdb-code${tentative === 0 ? ' tdb-code--premiere' : ''}${erreur ? ' tdb-code--erreur' : ''}`}>
              <span className="tdb-visuellement-cache">Code reçu par e-mail</span>
              <input
                ref={champCode}
                className="tdb-code__saisie"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={LONGUEUR_CODE}
                autoFocus
                aria-describedby="tdb-code-aide"
                aria-invalid={Boolean(erreur)}
                value={code}
                onChange={saisirCode}
              />
              {/* nouvelle clé à chaque code refusé : la secousse rejoue */}
              <span className="tdb-code__cases" aria-hidden="true" key={tentative}>
                {Array.from({ length: LONGUEUR_CODE }, (_, i) => (
                  <span
                    key={i}
                    className={`tdb-code__case${code[i] ? ' tdb-code__case--remplie' : ''}${i === Math.min(code.length, LONGUEUR_CODE - 1) ? ' tdb-code__case--courante' : ''}`}
                    style={{ '--i': i }}
                  >
                    {code[i] || ''}
                  </span>
                ))}
              </span>
            </label>
            <Bouton type="submit" disabled={occupe || code.length < LONGUEUR_CODE}>
              {occupe ? 'Vérification…' : 'Valider'}
            </Bouton>
            <div className="tdb-connexion__actions">
              <Bouton variante="fantome" icone="retour" onClick={onRecommencer} disabled={occupe}>
                Recommencer
              </Bouton>
            </div>
          </form>
        )}

        <p className="tdb-connexion__erreur" role="alert" aria-live="assertive">
          {erreur}
        </p>
      </section>
      <p className="tdb-connexion__pied">axelgregoire.fr · page privée, non indexée</p>
    </div>
  );
};

export default Connexion;
