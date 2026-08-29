# Bouton Google « Sources préférées » dans le footer + règle globale

Demande d'Axel (29/08/2026) : poser le bouton Preferred Sources dans le footer du
portfolio, et en faire une règle pour tous ses projets.

## Reste de la tâche précédente (blog)

- [ ] Déployer `chatbot-api` sur Vercel (`vercel --prod`, bloqué en mode auto) — Axel
- [ ] Commit `chatbot-api/api/blog/publish.js` (regex) — sur feu vert d'Axel
- [ ] Supprimer les 2 fragments dépubliés dans l'admin (optionnel)

## Plan

- [x] 1. `components/Footer/PreferredSourceButton.js` : bouton maison, deeplink en
      fallback, script Google chargé quand le footer est visible (mode manual),
      `addPreferredSource()` au clic, thème aligné dark/light
- [x] 2. `Footer.js` : bloc sous les icônes GitHub/LinkedIn
- [x] 3. `_footer.scss` : `.footer-preferred` (var(--*)), footer en `min-height`
- [x] 4. `npm run build-css` + lint CRA (dev server : « Compiled successfully », 0 warning)
- [x] 5. Vérification Playwright : light, dark (+hover), mobile 390px ; script Google
      chargé en mode manual quand le footer est visible (PREFERRED_SOURCE → {push,
      ready, api}, iframe de service Google, aucun bouton auto-rendu) ; href fallback
      correct ; chevauchement bulle chat / texte d'aide corrigé (padding-bottom 88px)
- [x] 6. Règle globale dans `~/.claude/CLAUDE.md` (sites éditoriaux uniquement)

## Review

- Bouton maison (pill menthe, `var(--*)`, dark/light), sous GitHub/LinkedIn ; texte
  d'aide « Pour voir mes articles plus souvent dans Google Discover, Actualités et les
  résumés IA. » ; footer en `min-height: 350px` pour absorber le bloc.
- Progressive enhancement : lien deeplink toujours fonctionnel, script Google lazy
  (IntersectionObserver, rootMargin 200px), clic → `addPreferredSource()`.
- Règle globale ajoutée dans `~/.claude/CLAUDE.md` (sites éditoriaux uniquement).
- Non fait / à noter : warning React préexistant (`key` dans CarouselComments) ;
  pas de bandeau de consentement sur le site → le script Google (iframe de service
  news.google.com) se charge dès que le footer est visible ; RGPD à trancher par Axel.
- Rien n'est commité (changements : Footer.js, PreferredSourceButton.js, _footer.scss,
  styles.css, tasks/, + publish.js de la tâche précédente).
