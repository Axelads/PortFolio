---
name: gsap-scrolltrigger
description: Règles et recettes GSAP/ScrollTrigger pour CE portfolio (CRA + JavaScript, pas Next.js). À charger avant toute animation scroll, reveal, parallaxe, scrub Lottie ou micro-interaction — contient le pattern maison, les règles de performance issues des incidents passés (CursorLens/aurora) et les easings imposés.
---

# GSAP + ScrollTrigger — règles du portfolio axelgregoire.fr

## 0. Réalité du stack (ne pas se tromper de framework)

- **Create React App** (react-app-rewired) + **JavaScript pur** — PAS de Next.js, PAS de TypeScript.
- `gsap` **3.12+ est déjà installé** (le cœur et les plugins pro sont gratuits). `ScrollTrigger` s'importe depuis `gsap/ScrollTrigger`.
- Styles : SCSS modulaire compilé **à la main** — après TOUTE modification SCSS, exécuter `npm run build-css` dans `frontend/` (index.js importe `styles.css` compilé, sinon rien n'apparaît).
- AOS existe sur une seule page historique (Avis) : **ne pas l'utiliser** pour du nouveau code, GSAP est la convention.

## 1. Pattern maison (copier ce shape, voir `src/components/Projects/Projects.js`)

```js
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger); // au niveau module, une seule fois

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

useEffect(() => {
  if (prefersReducedMotion()) return undefined; // garde JS OBLIGATOIRE (le SCSS ne suffit pas pour GSAP)
  const ctx = gsap.context(() => {
    gsap.fromTo(
      elementRef.current,
      { y: 30, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: elementRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      }
    );
  }, containerRef);
  return () => ctx.revert(); // cleanup systématique (tue tweens + ScrollTriggers)
}, [deps]);
```

Règles associées :
- Les éléments doivent être **visibles par défaut en CSS** — l'état initial (opacity 0) est posé par le `fromTo` au moment d'animer. JS désactivé ou reduced-motion ⇒ contenu visible.
- Listes de cartes : `cardsRef.current = []` au changement de filtre ; pour une pagination « charger plus », n'animer que les nouveaux éléments (compteur `animatedCountRef`).
- `clearProps: "all"` en fin de reveal si l'élément a ensuite des `:hover` CSS en `transform`.

## 2. Recettes ScrollTrigger

- **Reveal en lot** : `ScrollTrigger.batch(".card", { onEnter: (els) => gsap.fromTo(els, …) })` quand il y a beaucoup d'éléments hétérogènes.
- **Scrub (lié au défilement)** : `scrollTrigger: { trigger, start: "top bottom", end: "bottom top", scrub: 0.5 }` — `scrub` numérique (léger lissage) plutôt que `true`.
- **Pin** : `pin: true` réserve l'espace via un spacer — vérifier le layout autour (marges effondrées) et JAMAIS de pin sur un parent en `overflow: hidden`.
- **Scrub d'une animation Lottie (assets Fable)** — `lottie-web` n'est PAS installé (`npm i lottie-web` d'abord) :

```js
import lottie from "lottie-web";

const anim = lottie.loadAnimation({
  container: ref.current, renderer: "svg",
  loop: false, autoplay: false, path: "/anims/mon-asset.json",
});
anim.addEventListener("DOMLoaded", () => {
  const st = ScrollTrigger.create({
    trigger: ref.current, start: "top 80%", end: "bottom 20%", scrub: 0.5,
    onUpdate: (self) => anim.goToAndStop(self.progress * (anim.totalFrames - 1), true),
  });
});
// cleanup : st.kill(); anim.destroy();
```

- **Reveal par masque** : animer `clip-path` (`polygon`/`inset`) est acceptable ponctuellement (composité GPU dans les navigateurs modernes), mais tester sur machine modeste.

## 3. Performance — règles NON NÉGOCIABLES (incidents vécus sur ce site)

1. **N'animer que `transform` (translate/scale/rotate) et `opacity`.** Jamais `width/height/top/left/margin` (reflow).
2. **JAMAIS d'animation continue (`repeat: -1`, keyframes `infinite`, rAF permanent) derrière un `backdrop-filter` ou sous un `mix-blend-mode` plein écran.** C'est LA cause du lag desktop historique (aurora animée derrière le header en backdrop-filter + grain en mix-blend) : le navigateur re-rasterise le flou/blend à chaque frame, indéfiniment, même au repos. Fond décoratif ⇒ statique (rasterisé une fois).
3. **Filtres SVG (`feTurbulence`, `feDisplacementMap`) figés** : ne jamais réécrire leurs attributs par frame (incident CursorLens — supprimé, ne pas réintroduire d'effet équivalent).
4. **Boucles rAF de suivi curseur : idle-stop obligatoire** (couper quand la souris est immobile, relancer sur `pointermove`).
5. **Mobile** : kill-switch comme `_ambient.scss` — `@media (max-width: 768px), (pointer: coarse)` ⇒ animations décoratives coupées/allégées. ScrollTrigger : envisager `matchMedia()` GSAP pour des variantes desktop/mobile.
6. **Preuve avant conclusion perf** : un profil headless ne mesure PAS le coût GPU/compositing (backdrop-filter, blend). Tester sur vrai appareil, et vérifier le hash du bundle (`main.<hash>.js`) avant de juger un fix déployé inefficace.

## 4. Easings (rendu organique, jamais linéaire)

| Usage | Easing |
|---|---|
| Entrées / reveals | `power2.out`, `power3.out`, `expo.out` |
| Déplacements aller-retour, morphs | `power4.inOut`, `expo.inOut` |
| Micro-interactions « physiques » | `back.out(1.4)`, `elastic.out(1, 0.4)` (avec parcimonie) |
| Marquee / scrub | `none` (seul cas légitime de linéaire) |

Jamais d'easing CSS par défaut (`ease`, `linear`) sur un effet signature.

## 5. Intégration au site

- **Thèmes** : tout nouvel élément animé doit être stylé en `var(--*)` et vérifié en dark ET light (`[data-theme]` sur `<html>`).
- **Z-index** : contenu 1-10 · header 100 · modales 1000 · chatbot/grain ~9990 · loading 100000. Ne rien insérer au-dessus du header sans raison.
- **Splash screen** : l'app est montée sous l'overlay de chargement — les ScrollTriggers calculés au mount sont valides ; en cas de doute après chargement d'images, `ScrollTrigger.refresh()`.
- **Audits** : tester via `/?nosplash` (bypass du splash pour Lighthouse).

## 6. Lenis (smooth scroll) — pas installé, prudence

Lenis n'est PAS dans le projet. Avant toute installation site-entière : l'historique perf du site (backdrop-filter + fond animé) rend un smooth-scroll global risqué. Si un jour requis : instancier une seule fois, brancher `lenis.on('scroll', ScrollTrigger.update)` + `gsap.ticker.add((t) => lenis.raf(t * 1000))`, désactiver sur mobile et sous `prefers-reduced-motion`, et valider sur machine modeste AVANT de merger.
