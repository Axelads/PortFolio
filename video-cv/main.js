// CV en mouvement — timeline GSAP déterministe.
// Tout l'état visuel dépend du seul temps t : window.__seek(t) pose la timeline puis appelle rendreTout(t).
// Aucune animation CSS, aucun callback : le rendu image par image (scripts/rendre.mjs) est reproductible.
(async () => {
  const D = window.DONNEES;
  const L = window.LOGO;
  gsap.registerPlugin(CustomEase, SplitText);

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const W = 1920, H = 1080, CX = 960, CY = 540;
  const DUREE = 86;

  // ---------- attente des polices (mesures et SplitText en dépendent) ----------
  await Promise.all([
    '800 100px Montserrat', '900 100px Montserrat', '700 100px Montserrat', '600 100px Montserrat',
    '400 30px Poppins', '500 30px Poppins', '600 30px Poppins',
    '400 30px "JetBrains Mono"', '500 30px "JetBrains Mono"', '600 30px "JetBrains Mono"',
    '500 30px Fredoka', '600 30px Fredoka', '700 30px Fredoka',
  ].map((f) => document.fonts.load(f)));
  await document.fonts.ready;

  // ---------- outils ----------
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  const REPERES = [];
  const repere = (t, type, p = {}) => REPERES.push({ t: Math.round(t * 1000) / 1000, type, ...p });

  function alea(graine) { // mulberry32 : aléatoire reproductible
    let a = graine >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = alea(20261008);

  function hslRgb(h, s, l) {
    s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }
  const rgba = (c, a) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
  const lerp = (a, b, m) => a + (b - a) * m;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Instants où une valeur animée franchit chaque entier (pour caler les clics sonores sur l'odomètre)
  function franchissements(de, a, t0, duree, ease) {
    const e = gsap.parseEase(ease);
    const out = [];
    const sens = Math.sign(a - de);
    for (let k = Math.floor(de) + (sens > 0 ? 1 : 0); sens > 0 ? k <= a : k >= a; k += sens) {
      if (k === de) continue;
      let lo = 0, hi = 1;
      for (let i = 0; i < 40; i++) {
        const mi = (lo + hi) / 2;
        const v = de + (a - de) * e(mi);
        if ((sens > 0 && v < k) || (sens < 0 && v > k)) lo = mi; else hi = mi;
      }
      out.push(t0 + hi * duree);
    }
    return out;
  }

  // Les masques épousent la boîte de ligne : on leur donne de l'air pour ne couper ni accents ni jambages
  function aerer(masques) {
    masques.forEach((m) => Object.assign(m.style, { paddingTop: '0.12em', marginTop: '-0.12em', paddingBottom: '0.2em', marginBottom: '-0.2em' }));
  }
  function masquerMots(el) {
    const split = SplitText.create(el, { type: 'words', mask: 'words' });
    aerer(split.masks);
    return split.words;
  }
  function masquerLignes(el) {
    const split = SplitText.create(el, { type: 'lines', mask: 'lines' });
    aerer(split.masks);
    return split.lines;
  }
  function plage(sel, a, b) {
    tl.set(sel, { autoAlpha: 1 }, a);
    if (b !== undefined) tl.set(sel, { autoAlpha: 0 }, b);
  }
  function volet(sel, t, duree, x, y, couleur, ease = 'expo.inOut') {
    const r = Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) + 40;
    tl.set(sel, { visibility: 'visible', clipPath: `circle(0px at ${x}px ${y}px)` }, t);
    tl.to(sel, { clipPath: `circle(${r}px at ${x}px ${y}px)`, duration: duree, ease }, t);
    tl.set('#fond', { backgroundColor: couleur }, t + duree);
    tl.set(sel, { visibility: 'hidden' }, t + duree + 0.001);
  }

  gsap.set(['#s1', '#s2', '#s3', '#s4', '#s5', '#s6', '#s7', '#s8'], { autoAlpha: 0 });
  gsap.set('.aurore', { opacity: 0 });

  // =====================================================================
  // Grain de pellicule : une texture de bruit, décalée 24 fois par seconde
  // =====================================================================
  {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const x = c.getContext('2d');
    const img = x.createImageData(512, 512);
    const r = alea(7);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(r() * 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    $('#grain').style.backgroundImage = `url(${c.toDataURL()})`;
  }

  // =====================================================================
  // Logo : olivier-circuit vectorisé + 36 points
  // =====================================================================
  const HAUT_ARBRE = 339;
  const K = HAUT_ARBRE / L.hauteur;
  const AW = L.largeur * K;
  const AH = L.hauteur * K;
  const svgArbre = $('#arbre');
  svgArbre.setAttribute('viewBox', L.viewBox);
  svgArbre.setAttribute('width', AW);
  svgArbre.setAttribute('height', AH);
  Object.assign(svgArbre.style, { left: `${-AW / 2 - 4}px`, top: `${-AH / 2}px` });
  const OL = L.ancrages.olives.map((o) => ({ ...o, rx: 140, ry: 190 }));
  const ellipsesNoires = OL.map((o) => `<ellipse cx="${o.cx}" cy="${o.cy}" rx="${o.rx}" ry="${o.ry}" fill="#000"/>`).join('');
  svgArbre.innerHTML = `
    <defs>
      <path id="trait" d="${L.traitsPleins}" fill-rule="evenodd"/>
      <linearGradient id="gMonte" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>
      <linearGradient id="gBande" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="0.55" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
      <mask id="mPlein" maskUnits="userSpaceOnUse" x="-200" y="-600" width="2014" height="3636">
        <rect id="mpCorps" x="-200" y="0" width="2014" height="3200" fill="#fff"/>
        <rect id="mpFondu" x="-200" y="0" width="2014" height="260" fill="url(#gMonte)"/>
        ${ellipsesNoires}
      </mask>
      <mask id="mLueur" maskUnits="userSpaceOnUse" x="-200" y="-600" width="2014" height="3636">
        <rect id="mlBande" x="-200" y="0" width="2014" height="420" fill="url(#gBande)"/>
        ${ellipsesNoires}
      </mask>
      ${OL.map((o, i) => `<clipPath id="cO${i}"><ellipse cx="${o.cx}" cy="${o.cy}" rx="${o.rx}" ry="${o.ry}"/></clipPath>`).join('')}
    </defs>
    <g mask="url(#mPlein)"><use href="#trait" fill="#F3EEE3"/></g>
    <g id="lueur" mask="url(#mLueur)" style="filter: drop-shadow(0 0 22px rgba(139,199,177,0.95))"><use href="#trait" fill="#C9F7E4"/></g>
    ${OL.map((o, i) => `<g id="olive${i}" clip-path="url(#cO${i})"><use href="#trait" fill="#F3EEE3"/></g>`).join('')}
  `;
  const arbre = { f: L.hauteur + 300, lueur: 0 };
  const mpCorps = $('#mpCorps'), mpFondu = $('#mpFondu'), mlBande = $('#mlBande'), lueur = $('#lueur');
  function rendreArbre() {
    mpCorps.setAttribute('y', arbre.f);
    mpFondu.setAttribute('y', arbre.f - 260);
    mlBande.setAttribute('y', arbre.f - 230);
    lueur.style.opacity = arbre.lueur;
  }
  const olives = OL.map((o, i) => ({ el: $(`#olive${i}`), origine: `${o.cx} ${o.cy - o.ry}` }));
  olives.forEach((o) => gsap.set(o.el, { scale: 0, svgOrigin: o.origine }));

  // --- les 36 points ---
  const N = 36, R_EXT = 300, R_INT = 247, D_GROS = 34, D_PETIT = 19;
  const logo = $('#logo');
  const graine = document.createElement('div');
  graine.className = 'point';
  Object.assign(graine.style, { width: '26px', height: '26px', background: '#8BC7B1', boxShadow: '0 0 24px 4px rgba(139,199,177,0.7)' });
  logo.appendChild(graine);
  gsap.set(graine, { xPercent: -50, yPercent: -50, scale: 0 });

  const competences = D.categories.flatMap((c, ci) => c.items.map((nom) => ({ nom, ci })));
  const anneau = { rot: 0, ecrase: 1, incline: 0 };
  const points = [];
  for (let i = 0; i < N; i++) {
    const gros = i % 2 === 0;
    const d = gros ? D_GROS : D_PETIT;
    const teinte = ((i / N) * 360 + 200) % 360;
    const coul = hslRgb(teinte, 85, 65);
    const el = document.createElement('div');
    el.className = 'point';
    el.innerHTML = `<span class="pip" style="background:${rgba(coul, 1)}"></span><span class="lbl">${competences[i].nom}</span>`;
    Object.assign(el.style, { width: `${d}px`, height: `${d}px`, background: rgba(coul, 1), boxShadow: `0 0 18px 2px ${rgba(coul, 0.6)}` });
    logo.appendChild(el);
    points.push({
      i, el, d, coul, teinte, a0: (i / N) * Math.PI * 2 - Math.PI / 2, R: gros ? R_EXT : R_INT,
      comp: competences[i], lbl: $('.lbl', el), pip: $('.pip', el),
      s: { r: 0, a: 0, mix: 0, x: 0, y: 0, courbe: 0, sc: 0, op: 0 },
    });
  }
  function rendrePoints() {
    const ci = Math.cos(anneau.incline), si = Math.sin(anneau.incline);
    for (const p of points) {
      const s = p.s;
      const ang = p.a0 + s.a + anneau.rot;
      const px = s.r * Math.cos(ang);
      const py = s.r * Math.sin(ang) * anneau.ecrase;
      let x = px * ci - py * si;
      let y = px * si + py * ci;
      const prof = 1 + 0.34 * Math.sin(ang) * (1 - anneau.ecrase);
      if (s.mix > 0) {
        const dx = s.x - x, dy = s.y - y;
        const n = Math.hypot(dx, dy) || 1;
        const arc = Math.sin(s.mix * Math.PI) * s.courbe;
        x = lerp(x, s.x, s.mix) + (-dy / n) * arc;
        y = lerp(y, s.y, s.mix) + (dx / n) * arc;
      }
      const sc = s.sc * lerp(prof, 1, s.mix);
      p.el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) translate(-50%, -50%) scale(${sc.toFixed(4)})`;
      p.el.style.opacity = s.op;
    }
  }

  // Apparition du logo complet : orbite (G12) puis croissance de l'arbre (G02). Réutilisée en clôture.
  function construireLogo(t0, vitesse = 1) {
    const v = (x) => x / vitesse;
    tl.set(anneau, { rot: -Math.PI * 3.1, ecrase: 0.3, incline: -0.38 }, t0);
    points.forEach((p) => tl.set(p.s, { r: 0, a: -0.25 - (p.i % 3) * 0.32, sc: 0, op: 1, mix: 0 }, t0));
    tl.to(anneau, { rot: 0, duration: v(2.0), ease: 'expo.out' }, t0 + v(0.55));
    tl.to(anneau, { ecrase: 1, incline: 0, duration: v(1.1), ease: 'power3.inOut' }, t0 + v(1.35));
    points.forEach((p) => {
      tl.to(p.s, { r: p.R * 1.3, sc: 1, duration: v(0.9), ease: 'power2.out' }, t0 + v(0.55) + p.i * v(0.012));
      tl.to(p.s, { r: p.R, a: 0, duration: v(0.75), ease: 'back.out(2.2)' }, t0 + v(1.75) + p.i * v(0.008));
      // verrouillage : vague d'éclat autour de l'anneau
      tl.to(p.s, { sc: 1.55, duration: 0.12, ease: 'power2.out' }, t0 + v(2.35) + p.i * 0.014);
      tl.to(p.s, { sc: 1, duration: 0.4, ease: 'power2.inOut' }, t0 + v(2.35) + 0.12 + p.i * 0.014);
    });
    repere(t0 + v(0.55), 'orbite', { duree: v(2.0) });
    repere(t0 + v(2.35), 'verrou');
    // Croissance : le courant monte des broches du circuit jusqu'au tronc, puis l'arbre pousse
    const tA = t0 + v(2.3);
    tl.set(arbre, { f: L.hauteur + 300, lueur: 0 }, t0);
    olives.forEach((o) => tl.set(o.el, { scale: 0 }, t0));
    tl.to(arbre, { lueur: 1, duration: 0.25, ease: 'none' }, tA);
    tl.to(arbre, { f: L.ancrages.hautCircuit, duration: v(0.95), ease: 'power1.in' }, tA);
    tl.to(arbre, { f: -320, duration: v(1.25), ease: 'power2.out' }, tA + v(0.95));
    tl.to(arbre, { lueur: 0, duration: 0.5, ease: 'power1.in' }, tA + v(2.0));
    repere(tA, 'circuit', { duree: v(0.95) });
    repere(tA + v(0.95), 'pousse', { duree: v(1.25) });
    const tO = tA + v(2.05);
    olives.forEach((o, k) => {
      tl.to(o.el, { scale: 1, duration: 0.55, ease: 'back.out(3)', svgOrigin: o.origine }, tO + k * 0.14);
      repere(tO + k * 0.14, 'olive', { n: k });
    });
    return tO + 0.6;
  }

  // =====================================================================
  // S1 — intro (0 → 9 s)
  // =====================================================================
  plage('#s1', 0, 8.95);
  tl.to('.aurore', { opacity: 1, duration: 2.5, ease: 'power1.inOut' }, 0.2);
  tl.fromTo(graine, { scale: 0 }, { scale: 1, duration: 0.45, ease: 'back.out(3)' }, 0.3);
  tl.to(graine, { scale: 1.6, duration: 0.25, ease: 'power2.out' }, 0.8);
  tl.to(graine, { scale: 0, duration: 0.35, ease: 'power3.in' }, 1.05);
  repere(0.3, 'graine');
  const finLogo1 = construireLogo(0.3);
  tl.to(anneau, { rot: 0.32, duration: 3.6, ease: 'sine.inOut' }, finLogo1);

  tl.to('#logo', { x: -470, scale: 0.84, duration: 1.1, ease: 'expo.inOut' }, 5.0);
  repere(5.0, 'glisse');
  const motsS1 = $$('#s1-nom .mot').map((m) => { const w = masquerMots(m); return w; }).flat();
  tl.from(motsS1, { yPercent: 140, duration: 1.0, ease: 'expo.out', stagger: 0.1 }, 5.5);
  repere(5.5, 'titre');
  tl.from('#s1-trait', { scaleX: 0, duration: 0.7, ease: 'expo.out' }, 6.05);
  const motsTitre1 = masquerMots($('#s1-titre'));
  tl.from(motsTitre1, { yPercent: 140, duration: 0.8, ease: 'expo.out', stagger: 0.05 }, 6.15);
  const motsSous1 = masquerMots($('#s1-sous'));
  tl.from(motsSous1, { yPercent: 140, duration: 0.7, ease: 'expo.out', stagger: 0.07 }, 6.5);
  tl.from('#s1-lieu', { opacity: 0, y: 14, duration: 0.7 }, 6.85);

  // sortie : l'anneau éclate, le jour se lève depuis le logo
  tl.to([...motsS1, ...motsTitre1, ...motsSous1], { yPercent: -140, duration: 0.45, ease: 'power3.in', stagger: 0.02 }, 8.0);
  tl.to(['#s1-trait', '#s1-lieu'], { opacity: 0, duration: 0.3 }, 8.1);
  points.forEach((p) => tl.to(p.s, { r: p.R * 4.2, op: 0, duration: 0.75, ease: 'power3.in' }, 8.1 + (p.i % 6) * 0.015));
  tl.to('#arbre', { scale: 0.55, opacity: 0, duration: 0.5, ease: 'power3.in' }, 8.2);
  volet('#volet-papier', 8.3, 0.7, 490, 540, '#F3EEE3');
  tl.set('.aurore', { opacity: 0 }, 9.0);
  tl.to('#grain', { opacity: 0.15, duration: 0.7, ease: 'none' }, 8.3);
  tl.to('#vignette', { opacity: 0.4, duration: 0.7, ease: 'none' }, 8.3);
  repere(8.3, 'souffle', { duree: 0.7 });

  // =====================================================================
  // S2 — avant le code (9 → 24 s)
  // =====================================================================
  plage('#s2', 8.9, 24.05);
  const kick2 = masquerMots($('#s2-kicker'));
  tl.from(kick2, { yPercent: 140, duration: 0.6, ease: 'expo.out', stagger: 0.04 }, 9.0);
  const motsS2 = masquerMots($('#s2-titre'));
  tl.from(motsS2, { yPercent: 140, duration: 1.0, ease: 'expo.out', stagger: 0.09 }, 9.15);
  repere(9.0, 'impactDoux');
  tl.to(motsS2, { yPercent: -140, duration: 0.5, ease: 'power3.in', stagger: 0.04 }, 11.05);

  // odomètre : 2 0 [dizaines] [unités]
  const odo = { v: 2008 };
  const odoEl = $('#s2-odo');
  const bande = (n) => `<div class="col"><div class="bande">${Array.from({ length: n }, (_, k) => `<span>${k % 10}</span>`).join('')}</div></div>`;
  odoEl.innerHTML = `<div class="col"><div class="bande"><span>2</span></div></div><div class="col"><div class="bande"><span>0</span></div></div>${bande(10)}${bande(30)}`;
  const [bDiz, bUni] = $$('.bande', odoEl).slice(2);
  const cols = $$('.col', odoEl);
  cols.forEach((c) => { c.style.width = '0.64em'; });
  function rendreOdo() {
    const u = odo.v - 2000;
    const diz = Math.floor(u / 10) + Math.max(0, (u % 10) - 9);
    bUni.style.transform = `translateY(${(-u * 234).toFixed(2)}px)`;
    bDiz.style.transform = `translateY(${(-diz * 234).toFixed(2)}px)`;
  }
  tl.from(cols, { yPercent: 105, duration: 0.8, ease: 'expo.out', stagger: 0.06 }, 11.55);
  tl.from('#s2-odo-legende', { opacity: 0, y: 12, duration: 0.6 }, 11.8);

  // frise 2008 → 2023
  const frise = $('#s2-frise');
  const xAn = (a) => ((a - 2008) / 15) * 1600;
  for (let a = 2008; a <= 2023; a++) {
    const c = document.createElement('div');
    const marque = [2008, 2010, 2012, 2013, 2023].includes(a);
    c.className = `cran${marque ? '' : ' petit'}`;
    c.style.left = `${xAn(a) - 1}px`;
    frise.appendChild(c);
    if (marque) {
      const tx = document.createElement('div');
      tx.className = 'cran-txt';
      tx.textContent = a;
      tx.style.left = `${xAn(a)}px`;
      frise.appendChild(tx);
    }
  }
  $('#s2-gerance').style.left = `${xAn(2013)}px`;
  $('#s2-gerance').style.width = `${xAn(2023) - xAn(2013)}px`;
  $('#s2-gerance-txt').style.left = `${xAn(2013)}px`;
  tl.from('#s2-axe', { scaleX: 0, duration: 1.0, ease: 'expo.inOut' }, 11.5);
  tl.from($$('.cran, .cran-txt', frise), { opacity: 0, y: 8, duration: 0.4, stagger: 0.035 }, 11.9);
  tl.fromTo('#s2-repere', { scale: 0, x: xAn(2008) }, { scale: 1, duration: 0.5, ease: 'back.out(3)' }, 12.0);
  gsap.set('#s2-gerance', { scaleX: 0 });
  gsap.set('#s2-gerance-txt', { opacity: 0 });

  // étapes du parcours
  const carte = $('#s2-carte');
  const etapes = D.avant.map((e) => {
    const div = document.createElement('div');
    div.className = 'etape';
    div.innerHTML = `<div class="ligne"><span class="soc">${e.societe}</span></div>
      <div class="ligne"><span class="role">${e.role}</span></div>
      <div class="ligne"><span class="lieu">${e.lieu}</span></div>
      <div class="ligne"><span class="puce">${e.puce}</span></div>`;
    carte.appendChild(div);
    return $$('.ligne > span', div);
  });
  etapes.forEach((lignes) => gsap.set(lignes, { yPercent: 108 }));
  let anneePrec = 2008;
  D.avant.forEach((e, k) => {
    const T = 12.0 + k * 2;
    if (k > 0) tl.to(etapes[k - 1], { yPercent: -108, duration: 0.4, ease: 'power3.in', stagger: 0.04 }, T - 0.4);
    tl.to(etapes[k], { yPercent: 0, duration: 0.85, ease: 'expo.out', stagger: 0.07 }, T);
    if (k > 0) {
      tl.to(odo, { v: e.annee, duration: 0.9, ease: 'power3.inOut' }, T - 0.25);
      franchissements(anneePrec, e.annee, T - 0.25, 0.9, 'power3.inOut').forEach((t) => repere(t, 'cran'));
      tl.to('#s2-repere', { x: xAn(e.annee), duration: 0.9, ease: 'power3.inOut' }, T - 0.25);
    }
    repere(T, 'etape', { n: k });
    anneePrec = e.annee;
  });
  // 2013 → 2023 : les dix ans de gérance défilent
  tl.to(odo, { v: 2023, duration: 2.2, ease: 'expo.inOut' }, 18.7);
  franchissements(2013, 2023, 18.7, 2.2, 'expo.inOut').forEach((t) => repere(t, 'cran'));
  tl.to('#s2-gerance', { scaleX: 1, duration: 2.2, ease: 'expo.inOut' }, 18.7);
  tl.to('#s2-repere', { x: xAn(2023), duration: 2.2, ease: 'expo.inOut' }, 18.7);
  gsap.set('#s2-gerance-txt', { y: 10 });
  tl.to('#s2-gerance-txt', { opacity: 1, y: 0, duration: 0.6 }, 19.3);

  // vers 2023 : l'odomètre prend tout l'écran, la nuit tombe
  tl.to(etapes[3], { yPercent: -108, duration: 0.45, ease: 'power3.in', stagger: 0.04 }, 21.2);
  tl.to(['#s2-frise', '#s2-odo-legende', '#s2-kicker'], { opacity: 0, y: 20, duration: 0.5, ease: 'power3.in' }, 21.25);
  // odomètre : boîte 4 × 0,64 em = 768 px de large, 0,78 em = 234 px de haut, à (150, 300)
  tl.to('#s2-odo', { x: CX - (150 + 384), y: CY - 40 - (300 + 117), scale: 1.45, transformOrigin: '50% 50%', duration: 1.2, ease: 'expo.inOut' }, 21.4);
  const puis = masquerMots($('#s2-puis'));
  tl.from(puis, { yPercent: 140, duration: 0.7, ease: 'expo.out', stagger: 0.06 }, 22.25);
  repere(21.9, 'montee', { duree: 2.1 });
  volet('#volet-nuit', 23.15, 0.85, CX, CY, '#0B0F1E', 'expo.in');
  tl.to('#grain', { opacity: 0.09, duration: 0.85, ease: 'none' }, 23.15);
  tl.to('#vignette', { opacity: 1, duration: 0.85, ease: 'none' }, 23.15);

  // =====================================================================
  // S3 — 2023 : le code (24 → 30 s)
  // =====================================================================
  plage('#s3', 23.95, 30.1);
  tl.to('.aurore', { opacity: 1, duration: 1.4, ease: 'power1.out' }, 24.0);
  repere(24.0, 'chute');
  tl.from('#s3-editeur', { scale: 0.9, opacity: 0, y: 40, duration: 0.7, ease: 'expo.out' }, 24.0);
  const CODE = [
    [['c', '// 2023 : nouvelle carrière, même exigence']],
    [['k', 'const'], ['', ' axel '], ['p', '='], ['k', ' new'], ['f', ' Developpeur'], ['p', '({']],
    [['', '  formation: '], ['s', '"OpenClassrooms · Bac +2"'], ['p', ',']],
    [['', '  avant: ['], ['s', '"vente"'], ['p', ', '], ['s', '"gérance"'], ['p', ', '], ['s', '"relation client"'], ['', '],']],
    [['', '  depuis: '], ['n', '2023'], ['p', ',']],
    [['p', '});']],
    [],
    [['', 'axel.'], ['f', 'livrer'], ['p', '();'], ['c', '  // web · mobile · IA']],
  ];
  const zoneCode = $('#s3-code');
  const mesure = document.createElement('span');
  mesure.style.cssText = 'font: 400 34px/1 "JetBrains Mono"; position:absolute; visibility:hidden; white-space:pre';
  mesure.textContent = '0'.repeat(20);
  document.body.appendChild(mesure);
  const CH = mesure.getBoundingClientRect().width / 20;
  let tFrappe = 24.55;
  const VITESSE = 62;
  const curseur = $('#s3-curseur');
  gsap.set(curseur, { x: 100, y: 103 });
  CODE.forEach((segs, n) => {
    const l = document.createElement('div');
    l.className = 'lc';
    const texte = segs.map((s) => s[1]).join('');
    l.innerHTML = `<span class="num">${n + 1}</span><span class="txt"><span>${segs.map(([c, t]) => `<span class="${c}">${t.replace(/</g, '&lt;')}</span>`).join('')}</span></span>`;
    zoneCode.appendChild(l);
    const txt = $('.txt', l);
    gsap.set(txt, { width: 0 });
    const nb = texte.length;
    if (nb) {
      const d = nb / VITESSE;
      tl.to(txt, { width: nb * CH, duration: d, ease: `steps(${nb})` }, tFrappe);
      for (let k = 0; k < nb; k++) if (texte[k] !== ' ') repere(tFrappe + (k + 1) / VITESSE, 'frappe');
      // le curseur suit la ligne en cours
      const y0 = 40 + 58 + n * 34 * 1.62 + 6;
      tl.set(curseur, { y: y0, x: 48 + 52 }, tFrappe);
      tl.to(curseur, { x: 48 + 52 + nb * CH, duration: d, ease: `steps(${nb})` }, tFrappe);
      tFrappe += d + 0.09;
    } else {
      tFrappe += 0.12;
    }
  });
  // clignotement du curseur après la frappe
  tl.to(curseur, { opacity: 0, duration: 0.01, repeat: 3, yoyo: true, repeatDelay: 0.26 }, tFrappe + 0.05);
  const tSortie = Math.max(tFrappe + 0.15, 28.75);
  tl.from('#s3-sortie', { opacity: 0, x: -14, duration: 0.4, ease: 'power2.out' }, tSortie);
  repere(tSortie, 'valide');
  // l'éditeur se replie en un point, qui devient la graine de l'anneau
  tl.to('#s3-sortie', { opacity: 0, duration: 0.25 }, 29.25);
  tl.to('#s3-editeur', { scaleY: 0.006, duration: 0.32, ease: 'power3.in' }, 29.25);
  tl.to('#s3-editeur', { scaleX: 0.012, borderRadius: 999, duration: 0.3, ease: 'power3.in' }, 29.57);
  tl.to('#s3-editeur', { opacity: 0, duration: 0.05 }, 29.86);
  repere(29.25, 'repli', { duree: 0.65 });
  tl.set('#logo', { x: 0, y: 0, scale: 1 }, 29.8);
  tl.set('#arbre', { scale: 0.7, opacity: 0 }, 29.8);
  tl.fromTo(graine, { scale: 0 }, { scale: 1.2, duration: 0.12, ease: 'power2.out', immediateRender: false }, 29.85);
  tl.to(graine, { scale: 0, duration: 0.25, ease: 'power3.in' }, 30.0);

  // =====================================================================
  // S4 — compétences : chaque point du logo est une compétence (30 → 44 s)
  // =====================================================================
  plage('#s4', 29.9, 44.1);
  tl.set(anneau, { rot: 0, ecrase: 1, incline: 0 }, 29.9);
  points.forEach((p) => tl.set(p.s, { r: 0, a: 0, sc: 0, op: 1, mix: 0 }, 29.9));
  tl.set(arbre, { f: -320, lueur: 0 }, 29.9);
  olives.forEach((o) => tl.set(o.el, { scale: 1 }, 29.9));
  points.forEach((p) => tl.to(p.s, { r: p.R, sc: 1, duration: 1.2, ease: 'elastic.out(1, 0.55)' }, 30.0 + p.i * 0.005));
  tl.to('#arbre', { scale: 1, opacity: 1, duration: 0.9, ease: 'expo.out' }, 30.1);
  tl.to(anneau, { rot: 0.45, duration: 2.6, ease: 'sine.inOut' }, 30.0);
  repere(30.0, 'impact');
  repere(30.0, 'eclosion');

  const kick4 = masquerMots($('#s4-kicker'));
  tl.from(kick4, { yPercent: 140, duration: 0.6, ease: 'expo.out', stagger: 0.04 }, 30.25);
  const t4a = masquerMots($('#s4-titre'));
  const t4b = masquerMots($('#s4-titre2'));
  const t4c = masquerMots($('#s4-titre3'));
  tl.from(t4a, { yPercent: 140, duration: 0.9, ease: 'expo.out', stagger: 0.06 }, 30.4);
  tl.to(t4a, { yPercent: -140, duration: 0.4, ease: 'power3.in', stagger: 0.03 }, 32.05);
  tl.from(t4b, { yPercent: 140, duration: 0.9, ease: 'expo.out', stagger: 0.06 }, 32.45);
  gsap.set([t4b, t4c].flat(), { yPercent: 140 });
  tl.to(t4b, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 }, 32.45);

  // mise en page des puces par colonnes de catégories
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = '500 23px Poppins';
  const H_PUCE = 50, ECART = 12;
  const largeurPuce = (nom) => Math.ceil(ctx.measureText(nom).width) + 22 + 48;
  const COLONNES = [[0, 3, 6], [1, 4, 7], [2, 5, 8]];
  const X_COL = [110, 700, 1290], L_COL = 540;
  const blocs = [];
  COLONNES.forEach((col, c) => {
    col.forEach((ci) => {
      const cat = D.categories[ci];
      const lignes = [[]];
      let l = 0;
      for (const nom of cat.items) {
        const w = largeurPuce(nom);
        if (l + w > L_COL && lignes[lignes.length - 1].length) { lignes.push([]); l = 0; }
        lignes[lignes.length - 1].push({ nom, w });
        l += w + ECART;
      }
      blocs.push({ c, ci, lignes, h: 40 + lignes.length * H_PUCE + (lignes.length - 1) * ECART });
    });
  });
  const ESP_BLOC = 46;
  const zoneHaut = 240, zoneBas = 1030;
  // colonnes alignées en haut, la grille entière centrée dans la zone
  const hauteurCol = (c) => { const bs = blocs.filter((b) => b.c === c); return bs.reduce((s, b) => s + b.h, 0) + ESP_BLOC * (bs.length - 1); };
  const hMax = Math.max(...[0, 1, 2].map(hauteurCol));
  [0, 1, 2].forEach((c) => {
    let y = zoneHaut + (zoneBas - zoneHaut - hMax) / 2;
    blocs.filter((b) => b.c === c).forEach((b) => { b.y = y; y += b.h + ESP_BLOC; });
  });
  const titresCat = [];
  blocs.forEach((b) => {
    const premier = points.find((p) => p.comp.ci === b.ci);
    const t = document.createElement('div');
    t.className = 'cat-titre';
    t.textContent = D.categories[b.ci].nom;
    t.style.left = `${X_COL[b.c]}px`;
    t.style.top = `${b.y}px`;
    t.style.color = rgba(premier.coul, 1);
    $('#s4-cats').appendChild(t);
    titresCat.push(t);
    b.lignes.forEach((ligne, li) => {
      let x = X_COL[b.c];
      const y = b.y + 40 + li * (H_PUCE + ECART) + H_PUCE / 2;
      ligne.forEach(({ nom, w }) => {
        const p = points.find((q) => q.comp.nom === nom);
        p.cible = { x: x + w / 2 - CX, y: y - CY, w };
        x += w + ECART;
      });
    });
  });
  const titresCatMots = titresCat.map((t) => masquerMots(t)).flat();
  gsap.set(titresCatMots, { yPercent: 140 });

  const T_VOL = 32.55;
  tl.to('#arbre', { scale: 0.4, opacity: 0, duration: 0.55, ease: 'power3.in' }, T_VOL);
  points.forEach((p, k) => {
    const t = T_VOL + k * 0.026;
    tl.set(p.s, { x: p.cible.x, y: p.cible.y, courbe: (rnd() < 0.5 ? -1 : 1) * (70 + rnd() * 110) }, T_VOL - 0.01);
    tl.to(p.s, { mix: 1, sc: 1, duration: 1.0, ease: 'power3.inOut' }, t);
    const ta = t + 0.82;
    tl.to(p.el, { width: p.cible.w, height: H_PUCE, backgroundColor: rgba(p.coul, 0.14), boxShadow: `0 0 0px 0px ${rgba(p.coul, 0)}`, duration: 0.5, ease: 'expo.out' }, ta);
    tl.to(p.pip, { opacity: 1, duration: 0.2 }, ta + 0.05);
    tl.fromTo(p.lbl, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.45, ease: 'expo.out', immediateRender: false }, ta + 0.1);
    repere(ta, 'puce', { n: k });
  });
  repere(T_VOL, 'nuee', { duree: 1.8 });
  tl.to(titresCatMots, { yPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.035 }, 33.75);

  // le cœur du métier : les six compétences principales s'allument
  tl.to(t4b, { yPercent: -140, duration: 0.4, ease: 'power3.in', stagger: 0.03 }, 37.0);
  tl.to(t4c, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 }, 37.3);
  const heros = D.heros.map((n) => points.find((p) => p.comp.nom === n));
  const autres = points.filter((p) => !heros.includes(p));
  autres.forEach((p) => tl.to(p.s, { op: 0.22, duration: 0.5, ease: 'power2.out' }, 37.4));
  tl.to(titresCat, { opacity: 0.3, duration: 0.5 }, 37.4);
  heros.forEach((p, k) => {
    const t = 37.5 + k * 0.25;
    tl.to(p.s, { sc: 1.17, duration: 0.45, ease: 'back.out(3)' }, t);
    tl.to(p.el, { backgroundColor: rgba(p.coul, 0.3), boxShadow: `0 0 34px 4px ${rgba(p.coul, 0.55)}`, duration: 0.45 }, t);
    repere(t, 'heros', { n: k });
  });
  heros.forEach((p) => {
    tl.to(p.s, { sc: 1, duration: 0.5, ease: 'power2.inOut' }, 40.0);
    tl.to(p.el, { backgroundColor: rgba(p.coul, 0.14), boxShadow: `0 0 0px 0px ${rgba(p.coul, 0)}`, duration: 0.5 }, 40.0);
  });
  autres.forEach((p) => tl.to(p.s, { op: 1, duration: 0.5 }, 40.0));
  tl.to(titresCat, { opacity: 1, duration: 0.5 }, 40.0);
  tl.to(t4c, { yPercent: -140, duration: 0.4, ease: 'power3.in', stagger: 0.03 }, 40.6);

  // transition : toutes les puces tombent sauf une, orange, qui deviendra la balle de Lunello
  const balleP = points[19];
  tl.to(titresCatMots, { yPercent: -140, duration: 0.4, ease: 'power3.in', stagger: 0.01 }, 41.1);
  points.forEach((p) => {
    const t = 41.25 + rnd() * 0.35;
    tl.to(p.lbl, { opacity: 0, duration: 0.15 }, t);
    tl.to(p.pip, { opacity: 0, duration: 0.15 }, t);
    tl.to(p.el, { width: p.d, height: p.d, backgroundColor: rgba(p.coul, 1), duration: 0.3, ease: 'power2.inOut' }, t);
    if (p === balleP) return;
    tl.to(p.s, { y: 640 + rnd() * 120, duration: 0.75 + rnd() * 0.2, ease: 'power2.in' }, t + 0.3);
    tl.to(p.s, { x: `+=${(rnd() - 0.5) * 160}`, duration: 0.9, ease: 'power1.out' }, t + 0.3);
  });
  repere(41.6, 'cascade', { duree: 1.2 });
  tl.to(balleP.s, { x: 0, y: -380, duration: 0.9, ease: 'power3.inOut' }, 42.1);
  tl.to(balleP.el, { width: 64, height: 64, backgroundColor: '#F7A76C', boxShadow: '0 0 0px 0px rgba(247,167,108,0)', duration: 0.45, ease: 'back.out(2)' }, 42.9);
  points.forEach((p) => tl.set(p.s, { op: 0 }, 43.98));

  // =====================================================================
  // S5 — Lunello, le plus gros projet (44 → 58 s)
  // =====================================================================
  plage('#s5', 42.8, 57.6);
  const kick5 = masquerMots($('#s5-kicker'));
  tl.from(kick5, { yPercent: 140, duration: 0.6, ease: 'expo.out', stagger: 0.04 }, 42.85);
  const lab5 = masquerMots($('#s5-label'));
  tl.from(lab5, { yPercent: 140, duration: 0.8, ease: 'expo.out', stagger: 0.08 }, 42.95);
  tl.to(lab5, { yPercent: -140, duration: 0.4, ease: 'power3.in', stagger: 0.04 }, 43.75);
  repere(42.95, 'titre');

  // marque Lunello : lettres vectorielles, la balle les fait jaillir une à une
  const KM = 1.8;
  const MX = CX - (596 * KM) / 2, MY = 600 - (279 * KM) / 2;
  const svgM = $('#marque-svg');
  svgM.innerHTML = `<defs><clipPath id="cSourire"><rect id="rSourire" x="150" y="160" width="0" height="60"/></clipPath></defs>${window.MARQUE}`;
  $('#sourire', svgM).setAttribute('clip-path', 'url(#cSourire)');
  gsap.set('#s5-marque', { x: MX, y: MY });
  const lettres = ['L', 'u', 'n', 'e', 'l1', 'l2', 'o'].map((id) => $(`#${id}`, svgM));
  gsap.set(lettres, { scaleY: 0, transformOrigin: '50% 100%' });
  const signature = $('#signature', svgM);
  gsap.set(signature, { opacity: 0, y: 10 });
  const CENTRES = [80, 175, 255, 335, 393, 438, 501];
  const SOL = MY + 152 * KM - 32;
  const balle = $('#balle');
  gsap.set(balle, { x: CX, y: CY - 380, autoAlpha: 0 });
  tl.set(balle, { autoAlpha: 1 }, 43.98);
  tl.set('#s5-marque', { autoAlpha: 1 }, 43.98);
  // chute vers le L
  const xL = (k) => MX + CENTRES[k] * KM;
  tl.to(balle, { x: xL(0), duration: 0.52, ease: 'power1.out' }, 44.0);
  tl.to(balle, { y: SOL, duration: 0.52, ease: 'power2.in' }, 44.0);
  const IMPACTS = [44.52];
  const BONDS = [0.4, 0.37, 0.34, 0.31, 0.29, 0.3];
  const HAUTEURS = [230, 200, 170, 140, 115, 95];
  BONDS.forEach((d, k) => IMPACTS.push(IMPACTS[k] + d));
  volet('#volet-creme', IMPACTS[0], 0.95, xL(0), SOL + 32, '#FFF6EA', 'expo.out');
  tl.set('.aurore', { opacity: 0 }, IMPACTS[0] + 0.95);
  tl.to('#grain', { opacity: 0.1, duration: 0.6, ease: 'none' }, IMPACTS[0]);
  tl.to('#vignette', { opacity: 0.3, duration: 0.6, ease: 'none' }, IMPACTS[0]);
  tl.to('#s5-kicker', { opacity: 0, duration: 0.4 }, 44.6);
  IMPACTS.forEach((t, k) => {
    // écrasement au contact (au dernier, la balle ne reprend pas sa forme : elle gonfle en « o »)
    tl.to(balle, { scaleY: 0.62, scaleX: 1.32, duration: 0.05, ease: 'power2.out' }, t);
    if (k < 6) tl.to(balle, { scaleY: 1, scaleX: 1, duration: 0.22, ease: 'elastic.out(1, 0.5)' }, t + 0.05);
    repere(t, 'rebond', { n: k });
    if (k < 6) {
      tl.to(lettres[k], { scaleY: 1, duration: 0.5, ease: 'back.out(2.2)' }, t);
      tl.fromTo(lettres[k], { scaleX: 1.25 }, { scaleX: 1, duration: 0.5, ease: 'elastic.out(1, 0.45)', immediateRender: false }, t);
      const d = BONDS[k];
      tl.to(balle, { x: xL(k + 1), duration: d, ease: 'none' }, t);
      tl.to(balle, { y: SOL - HAUTEURS[k], duration: d / 2, ease: 'power2.out' }, t);
      tl.to(balle, { y: SOL, duration: d / 2, ease: 'power2.in' }, t + d / 2);
    }
  });
  // la balle devient le « o »
  const tO = IMPACTS[6];
  const yO = MY + 115 * KM;
  tl.to(balle, { y: yO, scaleX: (74 * KM) / 64, scaleY: (74 * KM) / 64, duration: 0.34, ease: 'back.out(2.5)' }, tO + 0.06);
  tl.set(lettres[6], { scaleY: 1 }, tO + 0.4);
  tl.to(balle, { autoAlpha: 0, duration: 0.12 }, tO + 0.4);
  repere(tO + 0.4, 'accord');
  tl.to('#rSourire', { attr: { width: 300 }, duration: 0.6, ease: 'power2.inOut' }, tO + 0.45);
  repere(tO + 0.45, 'sourire', { duree: 0.6 });
  // les personnages surgissent de derrière le mot
  const persos = ['menthe', 'abricot', 'bleu', 'sable', 'lilas'].map((n, k) => {
    const img = document.createElement('img');
    img.className = 'perso';
    img.src = `assets/lunello/${n}.png`;
    img.style.left = `${40 + k * 200}px`;
    $('#s5-persos').appendChild(img);
    return img;
  });
  gsap.set(persos, { yPercent: 105 });
  persos.forEach((p, k) => {
    const t = tO + 0.55 + [2, 1, 0, 1, 2][k] * 0.08 + k * 0.03;
    tl.to(p, { yPercent: 0, duration: 0.6, ease: 'back.out(1.7)' }, t);
    tl.fromTo(p, { scaleY: 0.8, scaleX: 1.15 }, { scaleY: 1, scaleX: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)', transformOrigin: '50% 100%', immediateRender: false }, t + 0.1);
    repere(t, 'perso', { n: k });
  });
  tl.to(signature, { opacity: 1, y: 0, duration: 0.6 }, tO + 1.1);

  // la marque se range en haut à gauche, les téléphones entrent
  tl.to(persos, { yPercent: 108, duration: 0.45, ease: 'power3.in', stagger: 0.04 }, 48.35);
  tl.to(signature, { opacity: 0, duration: 0.3 }, 48.4);
  tl.to('#s5-marque', { x: 110, y: 180, scale: 0.5, duration: 1.0, ease: 'expo.inOut' }, 48.75);
  repere(48.75, 'glisse');

  const tels = $('#telephones');
  const POSES = [
    { x: 1110, y: 575, ry: 18, rz: -2, z: -140 },
    { x: 1405, y: 540, ry: 0, rz: 0, z: 40 },
    { x: 1700, y: 575, ry: -18, rz: 2, z: -140 },
  ];
  const telEls = POSES.map((pose, k) => {
    const t = document.createElement('div');
    t.className = 'tel';
    t.innerHTML = `<div class="ecran"><img src="assets/lunello/${D.lunello.ecrans[k]}.jpg"><img class="e2" src="assets/lunello/${D.lunello.ecrans[k + 3]}.jpg"></div><div class="ilot"></div>`;
    tels.appendChild(t);
    gsap.set(t, { x: pose.x, y: pose.y + 900, rotationY: pose.ry, rotationZ: pose.rz, rotationX: 28, z: pose.z });
    gsap.set($('.e2', t), { yPercent: 100 });
    return t;
  });
  telEls.forEach((t, k) => {
    const T = 49.2 + [1, 0, 2][k] * 0.12;
    tl.to(t, { y: POSES[k].y, rotationX: 0, duration: 1.2, ease: 'expo.out' }, T);
    tl.to(t, { y: POSES[k].y - 12, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: 3 }, 50.75 + k * 0.2);
  });
  repere(49.2, 'souffle', { duree: 0.8 });

  const lignesAcc = masquerLignes($('#s5-accroche'));
  tl.from(lignesAcc, { yPercent: 140, duration: 0.9, ease: 'expo.out', stagger: 0.09 }, 49.55);
  const fonctions = D.lunello.fonctions.map((f) => {
    const div = document.createElement('div');
    div.className = 'fonction';
    div.innerHTML = `<i style="background:${f.couleur}"></i><span>${f.texte}</span>`;
    $('#s5-fonctions').appendChild(div);
    return div;
  });
  fonctions.forEach((f, k) => {
    const t = 50.1 + k * 0.25;
    tl.from($('i', f), { scale: 0, duration: 0.45, ease: 'back.out(3)' }, t);
    tl.from($('span', f), { opacity: 0, x: -18, duration: 0.6, ease: 'expo.out' }, t + 0.05);
    repere(t, 'pastille', { n: k });
  });
  // écrans suivants
  telEls.forEach((t, k) => {
    tl.to($('.e2', t), { yPercent: 0, duration: 0.75, ease: 'expo.inOut' }, 52.45 + k * 0.1);
    repere(52.45 + k * 0.1, 'balayage');
  });
  tl.to([...lignesAcc, ...fonctions], { opacity: 0, y: -20, duration: 0.4, ease: 'power3.in', stagger: 0.03 }, 52.3);
  const lignesStores = masquerLignes($('#s5-stores'));
  gsap.set(lignesStores, { yPercent: 140 });
  tl.to(lignesStores, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08 }, 52.75);
  const puces5 = D.lunello.stack.map((n) => {
    const s = document.createElement('span');
    s.className = 'puce-lu';
    s.textContent = n;
    $('#s5-stack').appendChild(s);
    return s;
  });
  gsap.set(puces5, { opacity: 0, scale: 0.6 });
  tl.to(puces5, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2.4)', stagger: 0.08 }, 53.2);
  puces5.forEach((_, k) => repere(53.2 + k * 0.08, 'puce', { n: k * 5 }));
  tl.to([...lignesStores, ...puces5], { opacity: 0, y: -20, duration: 0.4, ease: 'power3.in', stagger: 0.02 }, 54.75);
  const lignesFin = masquerLignes($('#s5-fin'));
  gsap.set(lignesFin, { yPercent: 140 });
  tl.to(lignesFin, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08 }, 55.1);
  repere(55.1, 'titre');

  // sortie : les téléphones s'envolent, la nuit revient par le « o »
  telEls.forEach((t, k) => tl.to(t, { y: -900, rotationX: -25, duration: 0.75, ease: 'power3.in' }, 56.25 + k * 0.07));
  tl.to(lignesFin, { yPercent: -140, duration: 0.45, ease: 'power3.in', stagger: 0.05 }, 56.3);
  const oX = 110 + 501 * KM * 0.5, oY = 180 + 115 * KM * 0.5;
  volet('#volet-nuit2', 56.65, 0.85, oX, oY, '#0B0F1E', 'expo.inOut');
  tl.to('#s5-marque', { opacity: 0, scale: 0.46, duration: 0.35, ease: 'power2.in' }, 57.15);
  tl.set('.aurore', { opacity: 1 }, 57.5);
  tl.to('#grain', { opacity: 0.09, duration: 0.85, ease: 'none' }, 56.65);
  tl.to('#vignette', { opacity: 1, duration: 0.85, ease: 'none' }, 56.65);
  repere(56.65, 'souffle', { duree: 0.85 });

  // =====================================================================
  // S6 — les autres projets (57,5 → 68 s)
  // =====================================================================
  plage('#s6', 57.45, 68.1);
  const kick6 = masquerMots($('#s6-kicker'));
  tl.from(kick6, { yPercent: 140, duration: 0.6, ease: 'expo.out', stagger: 0.04 }, 57.55);
  const tit6 = masquerMots($('#s6-titre'));
  tl.from(tit6, { yPercent: 140, duration: 0.7, ease: 'expo.out', stagger: 0.06 }, 57.7);
  const piste = $('#piste');
  const cartes = D.projets.map((p) => {
    const c = document.createElement('div');
    c.className = 'carte';
    c.innerHTML = `<div class="bande-acc" style="background:${p.accent}"></div>
      <div class="tuile"><img src="assets/projets/${p.logo}"></div>
      <h3>${p.nom}</h3><p>${p.texte}</p>
      <div class="pile">${p.stack.map((s) => `<span>${s}</span>`).join('')}</div>`;
    piste.appendChild(c);
    return c;
  });
  const car = { p: -2.4, grille: 0, op: 1 };
  function rendreCartes() {
    cartes.forEach((c, i) => {
      const o = i - car.p;
      const ao = Math.abs(o);
      const cx = o * 600, cz = -ao * 260, cry = clamp(-o * 30, -62, 62), csc = 1, cop = clamp(1.3 - ao * 0.45, 0, 1);
      const col = i % 4, row = Math.floor(i / 4);
      const gx = (col - 1.5) * 262, gy = (row - 0.5) * 300 - 40;
      const m = car.grille;
      const x = lerp(cx, gx, m), y = lerp(0, gy, m), z = lerp(cz, 0, m), ry = lerp(cry, 0, m), sc = lerp(csc, 0.44, m);
      const op = lerp(cop, 1, m) * car.op;
      c.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateY(${ry.toFixed(3)}deg) scale(${sc.toFixed(4)})`;
      c.style.opacity = op.toFixed(3);
      c.style.zIndex = String(100 - Math.round(ao * 10));
    });
  }
  tl.to(car, { p: 0, duration: 1.0, ease: 'expo.out' }, 57.6);
  repere(57.6, 'souffle', { duree: 0.6 });
  for (let k = 1; k < cartes.length; k++) {
    const t = 58.0 + k * 1.0;
    tl.to(car, { p: k, duration: 0.6, ease: 'power3.inOut' }, t);
    repere(t, 'carte', { n: k });
  }
  tl.to(car, { grille: 1, p: 3.5, duration: 1.1, ease: 'expo.inOut' }, 65.9);
  repere(65.9, 'glisse');
  const leg6 = masquerMots($('#s6-legende'));
  tl.from(leg6, { yPercent: 140, duration: 0.8, ease: 'expo.out', stagger: 0.05 }, 66.7);
  tl.to(car, { op: 0, duration: 0.45, ease: 'power2.in' }, 67.55);
  tl.to([...leg6, ...kick6, ...tit6], { yPercent: -140, duration: 0.4, ease: 'power3.in', stagger: 0.02 }, 67.5);

  // =====================================================================
  // S7 — ce que j'apporte (68 → 74 s)
  // =====================================================================
  plage('#s7', 67.95, 74.05);
  const kick7 = masquerMots($('#s7-kicker'));
  tl.from(kick7, { yPercent: 140, duration: 0.6, ease: 'expo.out', stagger: 0.04 }, 67.9);
  const compteurs = [];
  D.forces.forEach((f, k) => {
    const div = document.createElement('div');
    div.className = 'force';
    div.innerHTML = `<div class="ligne"><span class="ft">${f.titre}</span></div>
      <div class="fl"><div class="ligne"><span class="fn">0</span></div><div class="ligne"><span class="fu">${f.unite}</span></div></div>
      <div class="fx"></div>`;
    $('#s7').appendChild(div);
    const fx = $('.fx', div);
    fx.textContent = f.texte;
    const lignesFx = masquerLignes(fx);
    const T = 68.0 + k * 2;
    const ft = $('.ft', div), fn = $('.fn', div), fu = $('.fu', div);
    gsap.set([ft, fn, fu], { yPercent: 108 });
    gsap.set(lignesFx, { yPercent: 140 });
    tl.to(ft, { yPercent: 0, duration: 0.7, ease: 'expo.out' }, T);
    tl.to(fn, { yPercent: 0, duration: 0.8, ease: 'expo.out' }, T + 0.05);
    tl.to(fu, { yPercent: 0, duration: 0.8, ease: 'expo.out' }, T + 0.15);
    tl.to(lignesFx, { yPercent: 0, duration: 0.8, ease: 'expo.out', stagger: 0.07 }, T + 0.3);
    const c = { v: 0, el: fn };
    compteurs.push(c);
    if (f.nombre > 0) {
      tl.to(c, { v: f.nombre, duration: 0.95, ease: 'expo.out' }, T + 0.05);
      franchissements(0, f.nombre, T + 0.05, 0.95, 'expo.out').forEach((t) => repere(t, 'cran'));
    } else {
      // « 0 intermédiaire » : pas de décompte, le zéro tombe d'un coup
      tl.fromTo(fn, { scale: 1.6, transformOrigin: '20% 80%' }, { scale: 1, duration: 0.6, ease: 'expo.out', immediateRender: false }, T + 0.05);
    }
    repere(T, 'impact');
    if (k < 2) tl.to([ft, fn, fu, ...lignesFx], { yPercent: -140, duration: 0.4, ease: 'power3.in', stagger: 0.03 }, T + 1.62);
    else tl.to([ft, fn, fu, ...lignesFx, ...kick7], { yPercent: -140, duration: 0.4, ease: 'power3.in', stagger: 0.03 }, 73.5);
  });
  function rendreCompteurs() {
    for (const c of compteurs) c.el.textContent = String(Math.round(c.v));
  }

  // =====================================================================
  // S8 — clôture : citation, puis le logo se reforme (74 → 86 s)
  // =====================================================================
  plage('#s8', 73.95);
  const cit = $('#s8-citation');
  cit.innerHTML = D.citation.map((l, k) => `<div class="l${k + 1}">${l
    .replace('livrer', '<span class="vif">livrer</span>')
    .replace('construire', '<span class="vif">construire</span>')}</div>`).join('');
  const motsCit = $$('#s8-citation > div').map((l) => masquerMots(l));
  tl.from(motsCit[0], { yPercent: 140, duration: 0.9, ease: 'expo.out', stagger: 0.05 }, 74.1);
  tl.from(motsCit[1], { yPercent: 140, duration: 0.9, ease: 'expo.out', stagger: 0.05 }, 74.75);
  tl.from(motsCit[2], { yPercent: 140, duration: 1.0, ease: 'expo.out', stagger: 0.06 }, 76.2);
  repere(74.0, 'accordFin');
  repere(76.2, 'eclat');
  tl.to(motsCit.flat(), { yPercent: -140, duration: 0.45, ease: 'power3.in', stagger: 0.012 }, 78.3);

  // le logo revient : même grammaire qu'à l'ouverture, en plus rapide
  const T8 = 78.75;
  tl.set('#logo', { x: -470, y: 0, scale: 0.84 }, T8 - 0.05);
  tl.set('#arbre', { scale: 1, opacity: 1 }, T8 - 0.05);
  points.forEach((p) => tl.set(p.el, { width: p.d, height: p.d, backgroundColor: rgba(p.coul, 1), boxShadow: `0 0 18px 2px ${rgba(p.coul, 0.6)}` }, T8 - 0.05));
  const finLogo2 = construireLogo(T8, 1.35);
  tl.to(anneau, { rot: 0.55, duration: 86 - finLogo2, ease: 'sine.inOut' }, finLogo2);
  const motsS8 = $$('#s8-nom .mot').map((m) => masquerMots(m)).flat();
  tl.from(motsS8, { yPercent: 140, duration: 1.0, ease: 'expo.out', stagger: 0.1 }, 80.85);
  repere(80.85, 'titre');
  tl.from('#s8-trait', { scaleX: 0, duration: 0.7, ease: 'expo.out' }, 81.35);
  const motsT8 = masquerMots($('#s8-titre'));
  tl.from(motsT8, { yPercent: 140, duration: 0.8, ease: 'expo.out', stagger: 0.05 }, 81.45);
  const contacts = $('#s8-contacts');
  const I = D.identite;
  contacts.innerHTML = `<div class="site">${I.site}</div><div class="ct">${I.email}</div><div class="ct">${I.linkedin}</div><div class="ct">${I.github}</div>`;
  const lignesCt = $$('div', contacts);
  tl.from(lignesCt, { opacity: 0, y: 22, duration: 0.8, ease: 'expo.out', stagger: 0.13 }, 81.85);
  lignesCt.forEach((_, k) => repere(81.85 + k * 0.13, 'pastille', { n: k }));
  tl.from('#s8-dispo', { opacity: 0, y: 14, duration: 0.7 }, 82.55);
  tl.fromTo('#s8-dispo i', { scale: 0 }, { scale: 1, duration: 0.5, ease: 'back.out(3)', immediateRender: false }, 82.6);
  // respiration finale de l'anneau
  points.forEach((p) => {
    tl.to(p.s, { sc: 1.35, duration: 0.3, ease: 'sine.out' }, 83.6 + p.i * 0.03);
    tl.to(p.s, { sc: 1, duration: 0.5, ease: 'sine.inOut' }, 83.9 + p.i * 0.03);
  });
  tl.to('#noir', { opacity: 1, duration: 0.9, ease: 'power2.in' }, 85.1);
  tl.set({}, {}, DUREE);

  // =====================================================================
  // rendu par image
  // =====================================================================
  const aurores = $$('.aurore');
  const grain = $('#grain');
  function rendreTout(t) {
    gsap.set(aurores[0], { x: -260 + 260 * Math.sin(t * 0.13), y: -420 + 180 * Math.cos(t * 0.11) });
    gsap.set(aurores[1], { x: 880 + 220 * Math.cos(t * 0.09 + 1), y: 80 + 200 * Math.sin(t * 0.12 + 2) });
    gsap.set(aurores[2], { x: 220 + 300 * Math.sin(t * 0.07 + 4), y: 160 + 160 * Math.cos(t * 0.1 + 3) });
    const fr = Math.floor(t * 24);
    grain.style.backgroundPosition = `${(fr * 733) % 512}px ${(fr * 389) % 512}px`;
    rendrePoints();
    rendreArbre();
    rendreOdo();
    rendreCartes();
    rendreCompteurs();
  }

  // ---------- adaptation à la fenêtre (aperçu) ----------
  function ajuster() {
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    const sc = $('#scene');
    sc.style.transform = `translate(${(window.innerWidth - W * s) / 2}px, ${(window.innerHeight - H * s) / 2}px) scale(${s})`;
  }
  ajuster();
  window.addEventListener('resize', ajuster);

  window.__duree = DUREE;
  window.__reperes = REPERES.sort((a, b) => a.t - b.t);
  window.__seek = (t) => { tl.time(t); rendreTout(t); };

  const params = new URLSearchParams(location.search);
  if (params.has('jouer')) {
    tl.time(+params.get('jouer') || 0);
    tl.play();
    gsap.ticker.add(() => rendreTout(tl.time()));
  } else {
    window.__seek(+params.get('t') || 0);
  }
  window.__pret = true;
})();
