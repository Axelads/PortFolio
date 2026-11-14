import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const EPAISSEUR = 2.6;
const POLICE_MANUSCRITE = '"Parisienne", "Segoe Script", "Brush Script MT", cursive';

/** Image PNG (data URL) d'un tracé recadré sur son contenu, à l'échelle 2 pour un rendu net dans le PDF. */
function exporterTraces(traces) {
  const points = traces.flat();
  if (points.length < 2) return null;
  const marge = 14;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x0 = Math.min(...xs) - marge;
  const y0 = Math.min(...ys) - marge;
  const largeur = Math.max(40, Math.max(...xs) - x0 + marge);
  const hauteur = Math.max(24, Math.max(...ys) - y0 + marge);
  const echelle = Math.min(2, 1200 / largeur, 400 / hauteur);
  const toile = document.createElement('canvas');
  toile.width = Math.round(largeur * echelle);
  toile.height = Math.round(hauteur * echelle);
  const ctx = toile.getContext('2d');
  ctx.scale(echelle, echelle);
  ctx.lineWidth = EPAISSEUR;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#101828';
  for (const trace of traces) {
    if (trace.length === 1) {
      ctx.beginPath();
      ctx.arc(trace[0].x - x0, trace[0].y - y0, EPAISSEUR / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#101828';
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(trace[0].x - x0, trace[0].y - y0);
    for (let i = 1; i < trace.length - 1; i++) {
      const milieuX = (trace[i].x + trace[i + 1].x) / 2;
      const milieuY = (trace[i].y + trace[i + 1].y) / 2;
      ctx.quadraticCurveTo(trace[i].x - x0, trace[i].y - y0, milieuX - x0, milieuY - y0);
    }
    const dernier = trace[trace.length - 1];
    ctx.lineTo(dernier.x - x0, dernier.y - y0);
    ctx.stroke();
  }
  return toile.toDataURL('image/png');
}

/** Image PNG d'un nom saisi, rendu dans l'écriture manuscrite. */
async function exporterTexte(texte) {
  const propre = texte.trim().slice(0, 60);
  if (propre.length < 2) return null;
  try {
    await document.fonts.load(`72px ${POLICE_MANUSCRITE}`);
  } catch {
    // police indisponible : la police de secours fera l'affaire
  }
  const toile = document.createElement('canvas');
  const ctx = toile.getContext('2d');
  ctx.font = `72px ${POLICE_MANUSCRITE}`;
  const mesure = ctx.measureText(propre);
  toile.width = Math.min(1200, Math.ceil(mesure.width + 60));
  toile.height = 150;
  const ctx2 = toile.getContext('2d');
  ctx2.font = `72px ${POLICE_MANUSCRITE}`;
  ctx2.fillStyle = '#101828';
  ctx2.textBaseline = 'middle';
  ctx2.fillText(propre, 30, 78);
  return toile.toDataURL('image/png');
}

/**
 * Pavé de signature : tracé au doigt ou à la souris (pointer events), ou nom saisi au clavier rendu en écriture
 * manuscrite. `onChange({ mode, image })` à chaque modification ; `image` est une data URL PNG ou null.
 */
export default function PaveSignature({ nomParDefaut = '', onChange, desactive = false }) {
  const [mode, setMode] = useState('dessin');
  const [traces, setTraces] = useState([]);
  const [texte, setTexte] = useState(nomParDefaut);
  const toile = useRef(null);
  const enCours = useRef(null);
  const tracesRef = useRef(traces);
  tracesRef.current = traces;

  /** Redessine tout le pavé (taille d'écran, rapport de pixels). */
  const redessiner = useCallback(() => {
    const canvas = toile.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    // ligne de base
    ctx.strokeStyle = 'rgba(0, 51, 77, 0.18)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(24, rect.height - 44);
    ctx.lineTo(rect.width - 24, rect.height - 44);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = EPAISSEUR;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#101828';
    ctx.fillStyle = '#101828';
    for (const trace of tracesRef.current) {
      if (trace.length === 1) {
        ctx.beginPath();
        ctx.arc(trace[0].x, trace[0].y, EPAISSEUR / 2, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(trace[0].x, trace[0].y);
      for (let i = 1; i < trace.length - 1; i++) {
        ctx.quadraticCurveTo(trace[i].x, trace[i].y, (trace[i].x + trace[i + 1].x) / 2, (trace[i].y + trace[i + 1].y) / 2);
      }
      ctx.lineTo(trace[trace.length - 1].x, trace[trace.length - 1].y);
      ctx.stroke();
    }
  }, []);

  useLayoutEffect(() => {
    if (mode !== 'dessin') return undefined;
    redessiner();
    const observateur = new ResizeObserver(() => redessiner());
    if (toile.current) observateur.observe(toile.current);
    return () => observateur.disconnect();
  }, [mode, traces, redessiner]);

  // Export : au relâchement du tracé, ou quand le nom saisi change (avec un court délai).
  useEffect(() => {
    if (!onChange) return undefined;
    if (mode === 'dessin') {
      onChange({ mode, image: exporterTraces(traces) });
      return undefined;
    }
    let actif = true;
    const minuteur = setTimeout(async () => {
      const image = await exporterTexte(texte);
      if (actif) onChange({ mode, image });
    }, 250);
    return () => {
      actif = false;
      clearTimeout(minuteur);
    };
  }, [mode, traces, texte, onChange]);

  const position = (e) => {
    const rect = toile.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const commencer = (e) => {
    if (desactive || e.button > 0) return;
    e.preventDefault();
    toile.current.setPointerCapture(e.pointerId);
    enCours.current = [position(e)];
    setTraces((t) => [...t, enCours.current]);
  };
  const tracer = (e) => {
    if (!enCours.current) return;
    e.preventDefault();
    const p = position(e);
    const dernier = enCours.current[enCours.current.length - 1];
    if (Math.hypot(p.x - dernier.x, p.y - dernier.y) < 1.2) return;
    enCours.current.push(p);
    // trait immédiat, sans attendre le rendu React
    const ctx = toile.current.getContext('2d');
    ctx.lineWidth = EPAISSEUR;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#101828';
    ctx.beginPath();
    ctx.moveTo(dernier.x, dernier.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const finir = (e) => {
    if (!enCours.current) return;
    e.preventDefault();
    enCours.current = null;
    setTraces((t) => [...t]); // nouvelle référence : export et redessin propre
  };
  const effacer = () => setTraces([]);

  return (
    <div className="sig-pave">
      <div className="sig-pave__modes" role="tablist" aria-label="Mode de signature">
        {[
          ['dessin', 'Dessiner ma signature'],
          ['texte', 'Saisir mon nom'],
        ].map(([cle, libelle]) => (
          <button key={cle} type="button" role="tab" aria-selected={mode === cle} className={`sig-pave__mode${mode === cle ? ' sig-pave__mode--actif' : ''}`} onClick={() => setMode(cle)} disabled={desactive}>
            {libelle}
          </button>
        ))}
      </div>

      {mode === 'dessin' ? (
        <div className="sig-pave__zone">
          <canvas
            ref={toile}
            className="sig-pave__toile"
            aria-label="Zone de signature : tracez votre signature avec le doigt ou la souris"
            onPointerDown={commencer}
            onPointerMove={tracer}
            onPointerUp={finir}
            onPointerCancel={finir}
            onPointerLeave={finir}
          />
          {!traces.length && (
            <p className="sig-pave__aide" aria-hidden="true">
              Signez ici, avec le doigt ou la souris
            </p>
          )}
          <button type="button" className="sig-pave__effacer" onClick={effacer} disabled={desactive || !traces.length}>
            Effacer
          </button>
        </div>
      ) : (
        <div className="sig-pave__zone sig-pave__zone--texte">
          <label className="sig-champ">
            <span className="sig-champ__libelle">Votre prénom et votre nom</span>
            <input className="sig-champ__saisie" type="text" value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={60} autoComplete="name" disabled={desactive} />
          </label>
          <p className="sig-pave__apercu" aria-label="Aperçu de la signature">
            {texte.trim() || '—'}
          </p>
        </div>
      )}
    </div>
  );
}
