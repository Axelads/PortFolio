import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { URL_API_TABLEAU_DE_BORD } from './constantes';

// Phase 1 : connexion en deux étapes et preuve d'accès aux données. Le design complet viendra après la
// maquette Figma. Le jeton de session vit dans un cookie httpOnly posé par l'API : ce code n'y a jamais accès.

const STATUTS = { production: 'En production', developpement: 'En développement', pause: 'En pause', abandonne: 'Abandonné' };
const EVENEMENTS = {
  connexion_reussie: 'Connexion réussie',
  code_envoye: 'Code envoyé',
  mot_de_passe_refuse: 'Mot de passe refusé',
  code_refuse: 'Code refusé',
  verrouillage: 'Verrouillage',
  session_refusee: 'Session refusée',
  deconnexion: 'Déconnexion',
  deconnexion_partout: 'Toutes les sessions déconnectées',
};

const formatDate = (texte) =>
  new Date(String(texte).replace(' ', 'T')).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

const TableauDeBord = () => {
  const [etape, setEtape] = useState('chargement'); // chargement | identifiants | code | connecte
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [code, setCode] = useState('');
  const [compte, setCompte] = useState('');
  const [projets, setProjets] = useState([]);
  const [journal, setJournal] = useState([]);
  const jeton = useRef('');

  const appeler = useCallback(async (chemin, { methode = 'GET', corps } = {}) => {
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

  const recommencer = useCallback(async (message = '') => {
    setMotDePasse('');
    setCode('');
    setProjets([]);
    setJournal([]);
    setErreur(message);
    try {
      await appeler('/csrf');
    } catch {
      setErreur('Service injoignable. Réessaie dans un instant.');
    }
    setEtape('identifiants');
  }, [appeler]);

  const chargerDonnees = useCallback(async () => {
    const [p, j] = await Promise.all([appeler('/projets'), appeler('/securite/journal')]);
    if (p.statut === 401 || j.statut === 401) return recommencer('Session expirée : reconnecte-toi.');
    setProjets(p.json.projets || []);
    setJournal((j.json.entrees || []).slice(0, 10));
    return setEtape('connecte');
  }, [appeler, recommencer]);

  useEffect(() => {
    (async () => {
      try {
        const { json } = await appeler('/csrf');
        if (json.etape === 'connecte') {
          const s = await appeler('/session');
          if (s.statut === 200) {
            setCompte(s.json.email);
            return chargerDonnees();
          }
        }
        return setEtape(json.etape === 'code' ? 'code' : 'identifiants');
      } catch {
        setErreur('Service injoignable. Réessaie dans un instant.');
        return setEtape('identifiants');
      }
    })();
  }, [appeler, chargerDonnees]);

  const soumettre = async (evenement, action) => {
    evenement.preventDefault();
    setErreur('');
    setOccupe(true);
    try {
      await action();
    } catch {
      setErreur('Service injoignable. Réessaie dans un instant.');
    } finally {
      setOccupe(false);
    }
  };

  const envoyerIdentifiants = (e) =>
    soumettre(e, async () => {
      const { statut, json } = await appeler('/connexion', { methode: 'POST', corps: { email: email.trim(), motDePasse } });
      setMotDePasse('');
      if (statut === 200) return setEtape('code');
      if (statut === 403) await appeler('/csrf');
      return setErreur(json.erreur || 'Connexion impossible.');
    });

  const envoyerCode = (e) =>
    soumettre(e, async () => {
      const { statut, json } = await appeler('/connexion/code', { methode: 'POST', corps: { code: code.trim() } });
      setCode('');
      if (statut === 200) {
        setCompte(email.trim());
        return chargerDonnees();
      }
      if (statut === 401 && json.erreur !== 'Identifiants ou code invalides.') return recommencer(json.erreur);
      return setErreur(json.erreur || 'Code refusé.');
    });

  const deconnecter = async (partout) => {
    if (partout && !window.confirm('Déconnecter toutes les sessions, sur tous les appareils ?')) return;
    setOccupe(true);
    try {
      await appeler(partout ? '/deconnexion/partout' : '/deconnexion', { methode: 'POST' });
    } finally {
      setOccupe(false);
      recommencer(partout ? 'Toutes les sessions ont été déconnectées.' : '');
    }
  };

  return (
    <div className="tdb">
      <Helmet>
        <title>Tableau de bord</title>
        <meta name="robots" content="noindex, nofollow, noarchive" />
        <meta name="referrer" content="no-referrer" />
      </Helmet>

      <section className={`tdb__carte${etape === 'connecte' ? ' tdb__carte--large' : ''}`} aria-labelledby="tdb-titre" aria-busy={occupe || etape === 'chargement'}>
        <h1 id="tdb-titre" className="tdb__titre">Tableau de bord</h1>

        {etape === 'chargement' && <p className="tdb__texte">Vérification de la session…</p>}

        {etape === 'identifiants' && (
          <form className="tdb__formulaire" onSubmit={envoyerIdentifiants} noValidate>
            <label className="tdb__champ">
              <span>Adresse e-mail</span>
              <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="tdb__champ">
              <span>Mot de passe</span>
              <input type="password" autoComplete="current-password" required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
            </label>
            <button className="tdb__bouton" type="submit" disabled={occupe || !email || !motDePasse}>
              {occupe ? 'Vérification…' : 'Continuer'}
            </button>
          </form>
        )}

        {etape === 'code' && (
          <form className="tdb__formulaire" onSubmit={envoyerCode} noValidate>
            <p className="tdb__texte">Un code à 8 chiffres vient d'être envoyé par e-mail. Il expire dans 5 minutes.</p>
            <label className="tdb__champ">
              <span>Code reçu</span>
              <input
                className="tdb__code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={10}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </label>
            <button className="tdb__bouton" type="submit" disabled={occupe || code.length < 6}>
              {occupe ? 'Vérification…' : 'Se connecter'}
            </button>
            <button className="tdb__lien" type="button" onClick={() => recommencer()}>
              Recommencer
            </button>
          </form>
        )}

        {etape === 'connecte' && (
          <div className="tdb__connecte">
            <p className="tdb__texte">
              Connecté : <strong>{compte}</strong>
            </p>

            <h2 className="tdb__sous-titre">Projets ({projets.length})</h2>
            <ul className="tdb__liste">
              {projets.map((p) => (
                <li key={p.slug} className="tdb__projet">
                  <span className="tdb__pastille" style={{ background: p.couleurAccent || 'var(--text-muted)' }} aria-hidden="true" />
                  <span className="tdb__projet-nom">{p.nom}</span>
                  <span className="tdb__projet-statut">{STATUTS[p.statut] || p.statut}</span>
                </li>
              ))}
            </ul>

            <h2 className="tdb__sous-titre">Journal de sécurité</h2>
            <ul className="tdb__liste tdb__liste--journal">
              {journal.map((e, i) => (
                <li key={`${e.date}-${i}`}>
                  <span className={e.reussi ? 'tdb__ok' : 'tdb__ko'}>{EVENEMENTS[e.evenement] || e.evenement}</span>
                  <span>{formatDate(e.date)}</span>
                  <span className="tdb__ip">{e.ip}</span>
                </li>
              ))}
            </ul>

            <div className="tdb__actions">
              <button className="tdb__bouton tdb__bouton--secondaire" type="button" disabled={occupe} onClick={() => deconnecter(false)}>
                Se déconnecter
              </button>
              <button className="tdb__lien" type="button" disabled={occupe} onClick={() => deconnecter(true)}>
                Déconnecter toutes les sessions
              </button>
            </div>
          </div>
        )}

        <p className="tdb__erreur" role="alert" aria-live="assertive">
          {erreur}
        </p>
      </section>
    </div>
  );
};

export default TableauDeBord;
