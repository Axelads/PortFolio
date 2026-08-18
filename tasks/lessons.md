# Lessons Learned

## Session : CV en ligne /cv (2026-08-18)

### ❌ ERREUR — Media query mobile qui casse l'impression
À l'impression, la largeur CSS = largeur du papier (A4 ≈ 794px) : un
`@media (max-width: 920px)` s'applique donc AUSSI au PDF et avait basculé le CV
en layout mobile une colonne. Règle : sur toute page imprimable, préfixer le
responsive par `@media screen and (max-width: …)` ET réaffirmer le layout
critique dans le bloc `@media print`. Vérifier avec un vrai `page.pdf()`
Puppeteer (le devDependency du frontend), pas seulement à l'écran.

### ✅ PATTERN — Captures pleine page Playwright et header fixed
Sur les screenshots `fullPage`, le header fixed est recollé au mauvais offset
(artefact d'assemblage). Ne jamais « corriger » un chevauchement vu uniquement
sur une capture pleine page : re-vérifier avec une capture viewport simple.

## Session : Blog auto-alimenté /blog (2026-08-03)

### ✅ PATTERN — Détecter la version PocketBase SANS identifiants
`POST /api/collections/_superusers/auth-with-password` avec des identifiants bidons :
**400** = l'endpoint existe → PB moderne (≥ 0.23, format « fields » à plat) ;
**404** = absent → tester `/api/admins/auth-with-password` (legacy, format « schema »
avec `options` imbriquées). Permet d'écrire le bon payload de création de collection
avant même d'avoir les identifiants superuser. (Instance Koyeb du portfolio : MODERNE.)

### ✅ PATTERN — Génération de contenu à 0 € d'API
Exigence utilisateur : « je veux pas payer d'api ». Solution : routine Claude planifiée
(claude.ai/code/routines, outil RemoteTrigger) qui rédige sur l'ABONNEMENT puis publie
via un endpoint Vercel sécurisé Bearer qui, lui, ne contient AUCUN appel Anthropic.
Le secret vit dans le prompt de la routine (portée limitée : publier un article, rien
d'autre). Cron min 1 h, exprimé en UTC ; créer `enabled:false` et n'activer qu'après
un test « run now » réussi de bout en bout.

### ⚠️ RÈGLE — Préférence utilisateur durable
Axel refuse tout coût API récurrent pour les features du site. Avant de proposer une
architecture qui consomme l'API Anthropic (ou tout service facturé à l'usage), chercher
d'abord une variante abonnement/gratuit et annoncer le coût AVANT de planifier.

### ❌ ERREUR — Chaînes accentuées dans les one-liners PowerShell
Un `node -e "... 'L'IA générative...'"` explose sur l'apostrophe/les accents (quoting
PS 5.1). Règle : pour tester du code avec des chaînes françaises, toujours passer par un
fichier de script temporaire dans le scratchpad, jamais par un one-liner inline.

### ✅ PATTERN — Vérif visuelle d'une page du build prod sans dev server
Mini serveur statique Node (http + fallback SPA index.html) sur le dossier `build/` +
Puppeteer avec `evaluateOnNewDocument(() => localStorage.setItem('portfolio-theme', t))`
et `/page?nosplash`. Donne les captures light/dark/mobile en ~30 s sans `npm start`.
Rappel : le thème DOIT être posé avant `goto` (leçon 2026-06-15 toujours valable).

### ⚠️ RAPPEL — `.project-resume-html` est hardcodé mode clair
Toute nouvelle surface de rendu riche doit utiliser sa propre classe en `var(--*)`
(le blog utilise `.article-body`). Ne pas réutiliser `.project-resume-html` hors de la
page projet (fond vert fixe).

## Session : Page de Loading avec vidéo (2026-04-10)

### ❌ ERREUR 1 — Timer caché dans App.js
**Pattern :** Il existait un `setTimeout(() => setIsFirstLoad(false), 4000)` dans `App.js` qui coupait le loading indépendamment du composant `Loading.js`.
**Règle :** Avant de modifier un timer dans un composant, toujours grep `setTimeout` + `setIsFirstLoad` sur l'ensemble du projet pour détecter les doublons.

### ❌ ERREUR 2 — `Date.now()` dans le JSX cause des rechargements vidéo
**Pattern :** Mettre `src={`/loading.mp4?v=${Date.now()}`}` directement dans le JSX recalcule la valeur à chaque re-render, ce qui recharge la vidéo en boucle.
**Règle :** Toujours stabiliser les URLs dynamiques avec `useRef`.
**MAJ 2026-06-24 :** `?v=${Date.now()}` (même via useRef) casse aussi le cache
**entre visites** → la vidéo de 7 s est retéléchargée à chaque chargement (mauvais
LCP). Pour un asset statique comme `loading.mp4`, utiliser une **URL stable**
(`useRef('/loading.mp4')`) afin qu'il soit mis en cache par le navigateur. Pour
forcer une nouvelle version après remplacement du fichier, renommer le fichier ou
utiliser un suffixe de version FIXE (`?v=2`), jamais `Date.now()`.

### ❌ ERREUR 3 — `object-fit: cover` vs `contain` selon le format de la vidéo
**Pattern :** `object-fit: cover` recadre la vidéo (idéal plein écran 16:9), `object-fit: contain` affiche tout mais laisse des bandes. Si la vidéo n'est pas en 16:9, les bandes sont inévitables avec `contain`.
**Règle :** Toujours vérifier le ratio de la vidéo avant de choisir. Recommander à l'utilisateur d'exporter en 16:9 si nécessaire.

### ❌ ERREUR 4 — `box-shadow` non demandé ajouté
**Pattern :** Ajout d'une ombre portée sur le bloc vidéo sans que l'utilisateur le demande.
**Règle :** Ne jamais ajouter d'effets visuels (ombre, border-radius, etc.) non explicitement demandés. Simplicité prioritaire.

### ❌ ERREUR 5 — `justify-content: center` laisse un espace blanc en bas
**Pattern :** Quand le contenu (vidéo + div texte) est plus petit que l'écran, `justify-content: center` répartit l'espace équitablement en haut ET en bas — d'où la bande blanche en bas.
**Règle :** Pour qu'une div enfant "colle" au bas sans bande blanche, utiliser `flex: 1` sur cette div pour qu'elle absorbe tout l'espace restant.

### ✅ PATTERN QUI FONCTIONNE — Transition vidéo → section sombre
Utiliser `::before` avec `position: absolute; top: -40px` sur la div texte pour créer un dégradé qui chevauche le bas de la vidéo. Plus propre que `::after` sur la div vidéo car centré sur la div destinataire.

### ✅ PATTERN QUI FONCTIONNE — Style texte avec traits
```scss
.loading-name {
  display: flex;
  align-items: center;
  gap: 16px;
  &::before, &::after {
    content: '';
    display: block;
    width: 50px;
    height: 1px;
    background: rgba(255, 255, 255, 0.35);
  }
}
```
Approuvé par l'utilisateur. À réutiliser pour les titres sur fond sombre.

## Session : Optimisation mobile + logo footer (2026-06-15)

### ⚠️ RAPPEL UTILISATEUR — Toujours gérer le thème dark/light
**Pattern :** L'utilisateur rappelle systématiquement de gérer le `ThemeContext` (dark ET light) sur tout nouveau composant visuel.
**Règle :** Pour CHAQUE nouvel élément ajouté à l'UI :
- Texte/fond → utiliser les variables CSS `var(--text-primary)`, `var(--bg-*)` (jamais de couleur en dur).
- Logo/image sombre → passer `invertLogo={isDark}` (via `useTheme()`) pour l'inverser en blanc sur fond sombre.
- Vérifier visuellement le rendu dans LES DEUX thèmes (forcer `localStorage['portfolio-theme'] = 'dark'` dans le script puppeteer avant `goto`).

### ✅ PATTERN QUI FONCTIONNE — Bulles animées tournantes autour d'un logo
Le composant `AxelLogo` (props `spin`, `spinDuration`) enveloppe les dots dans un `<div>` séparé du logo central pour que SEULES les bulles tournent (animation `axel-logo-spin`, keyframes dans `_footer.scss`). Visible mobile uniquement via `.footer-logo { display: none; @media (max-width: 750px) { display: flex; } }`. Respecte `prefers-reduced-motion`.

### ❌ ERREUR — Header passe DERRIÈRE le contenu (z-index trop bas)
**Pattern :** `.header-container` et `.header-responsive` avaient `z-index: 1`, identique à `.CardSkill` (z-index: 1). À z-index égal, l'élément le plus bas dans le DOM gagne → la CardSkill recouvrait le header.
**Règle :** Le header (`position: fixed`) doit avoir un z-index nettement au-dessus du contenu. Hiérarchie z-index du projet à respecter :
- Contenu page : 1–10
- **Header : 100**
- Modales (contact) : 1000
- Chatbot / grain : ~9990
- Curseur lens : 10000
- **Loading (overlay plein écran) : 100000** — doit couvrir le cursor-lens depuis
  que `<App/>` est monté en permanence sous le splash (voir session 2026-06-24).

Ne PAS baisser le z-index de `.CardSkill` (il sert à passer au-dessus du `::before` de `.informations`) — remonter le header à la place. Penser à corriger LES DEUX (`.header-container` desktop ET `.header-responsive` mobile, chacun `position: fixed` = contexte d'empilement propre).

## Session : Perf — lag post-loading + Lighthouse bloqué (2026-06-24)

### ❌ ERREUR — Un splash qui REMPLACE l'app bloque tout audit (Lighthouse/PageSpeed)
**Pattern :** `App.js` faisait `isFirstLoad ? <Loading/> : <App/>`. Pendant les 8,5 s
de splash, le vrai DOM n'existait pas → Lighthouse ne mesurait que la vidéo de
loading, et l'app se montait d'un bloc APRÈS (jank).
**Règle :** Un écran de chargement doit être un **overlay** au-dessus de l'app
montée en permanence (`<><App/>{isFirstLoad && <Loading/>}</>`), pas une branche qui
remplace l'app. Bonus : prévoir un **bypass du splash** pour les audits/bots —
`?nosplash`, UA `Lighthouse|HeadlessChrome|Google Page Speed`, `navigator.webdriver`.
Auditer ensuite via `https://…/?nosplash`.

### ❌ ERREUR — `backdrop-filter` + filtre SVG animé par frame = tueur de perf
**Pattern :** `CursorLens` cumulait un `backdrop-filter: invert(...)` (re-rasterise
tout ce qu'il y a derrière) ET un masque SVG dont `feDisplacementMap.scale` était
réécrit à CHAQUE frame via rAF → le filtre SVG était recalculé en continu.
**Règle :**
- Un filtre SVG (`feTurbulence`/`feDisplacementMap`) ne doit JAMAIS voir ses
  attributs modifiés par frame : le rendre **statique** (calculé une fois, mis en
  cache). Pour de la « vie », n'animer que des **transforms GPU** (translate/scale/rotate).
- Avec une boucle rAF de suivi de curseur, toujours prévoir un **idle-stop** :
  couper le rAF dès que la souris est immobile (distance < seuil & vitesse ~0), le
  relancer au prochain `pointermove`. Sinon le `backdrop-filter` est recomposé
  60×/s même au repos. Vérifié : 0 écriture de transform au repos après ce fix.

### ❌ ERREUR — `return null` placé AVANT les hooks (règles des hooks)
**Pattern :** `CursorLens` faisait `if (isTouchOnly) return null;` avant les
`useRef`/`useEffect` → nombre de hooks variable selon le device.
**Règle :** Calculer le flag, appeler TOUS les hooks, et ne faire le `return null`
qu'APRÈS (juste avant le JSX). Les gardes device vont dans le corps de l'effet.

### ✅ PATTERN QUI FONCTIONNE — Prouver une optim perf en headless (Puppeteer)
Le compteur `requestAnimationFrame` global est trop bruité (GSAP a un ticker
permanent). Pour isoler UN composant, observer **son** effet de bord via un
`MutationObserver` sur l'attribut `style` de l'élément qu'il anime, et comparer
mouvement vs repos. En headless, le CursorLens est désactivé par `matchMedia` →
patcher `window.matchMedia` (`evaluateOnNewDocument`) pour simuler `hover:hover` /
`pointer:fine`. `emulateMediaFeatures` ne gère PAS `hover`/`pointer`.

### ⚠️ CORRECTION (2026-07-08) — le CursorLens ÉTAIT bien le coupable
Le lendemain, Axel confirme : site fluide avec SEULEMENT le retrait du CursorLens
(animations ambient encore actives dans le bundle déployé). Son « ça n'a rien
changé » initial testait en réalité l'ANCIEN bundle (cache navigateur/CDN, résolu
après ~1 jour). Les animations ambient ont donc été RÉACTIVÉES le 2026-07-08.
**Règle anti-récidive :** avant de conclure qu'un fix perf déployé est inefficace,
vérifier que le bundle testé est bien le nouveau : comparer le hash
`main.<hash>.js` dans l'onglet Réseau avec celui du dossier `build/`, ou tester en
navigation privée / Ctrl+F5. Ne JAMAIS empiler un 2e fix (suppression d'anims…)
sur la foi d'un test potentiellement fait sur l'ancien bundle.
La section ci-dessous reste utile pour son contenu technique (backdrop-filter +
fond animé = coût continu) mais sa conclusion « pas le coupable » était FAUSSE :

### ❌ FAUSSE PISTE — le CursorLens n'était PAS le coupable du lag desktop
**Pattern :** après avoir optimisé puis SUPPRIMÉ le CursorLens, ça ramait toujours.
La vraie cause a été révélée par un test d'Axel : **sur mobile aucun lag**, sur
desktop oui. Or `_ambient.scss` coupe déjà les animations de fond sur mobile
(`@media (max-width:768px),(pointer:coarse){ .ambient__blob,.ambient-grain{animation:none} }`).
**Règle (cause racine) :** un `backdrop-filter` (header `.header-desktop`) ou un
`mix-blend-mode` (grain plein écran) placé AU-DESSUS d'un fond qui s'anime en
**continu** (`animation: … infinite` sur l'aurora) force le navigateur à recalculer
le flou/blend à CHAQUE frame, **indéfiniment, même au repos** → lag desktop
permanent. Fix : rendre le fond **statique** (retirer les animations `infinite`) →
il est rasterisé une fois puis mis en cache. C'est exactement ce que faisait déjà
le mobile (d'où sa fluidité). Bonus : grain passé de `inset:-50%` à `inset:0`
(surface de blend ÷4). **Ne JAMAIS animer en continu un élément situé derrière un
backdrop-filter ou sous un mix-blend-mode plein écran.**

### ⚠️ LIMITE OUTIL — le profilage HEADLESS ne mesure PAS le coût GPU/compositing
**Pattern :** un trace Puppeteer (paint/composite/raster sur 2.5s) donnait ~334ms
pour TOUTES les configs (baseline, sans aurora, sans grain, sans blur header) —
aucune différence. Le `backdrop-filter`/`blur`/`mix-blend` sont rendus côté GPU,
que le headless ne reproduit pas fidèlement (`GPUTask` ~constant).
**Règle :** pour un lag de type compositing (flou, blend, backdrop-filter), NE PAS
se fier à un profil headless. Se fier à un **A/B sur vrai appareil** (ici
mobile vs desktop) ou demander à l'utilisateur de tester. `page.metrics()` ne
capture que le thread principal (JS/layout/style), jamais le compositeur GPU.

## Session : Dashboard admin — update PocketBase impossible (2026-07-08)

### ❌ ERREUR — Session PocketBase expirée jamais détectée (le bug qu'Axel a vécu)
**Pattern :** le token de la collection `users` expire au bout de **7 jours**.
`isAuthenticated()` ne vérifiait que la PRÉSENCE du token en localStorage. La
collection `projects` a `listRule` PUBLIQUE mais update protégé → dashboard
d'apparence normale (la liste charge), mais tout PATCH avec token mort → **404 à
corps vide** (PocketBase masque les records aux non-autorisés). Message affiché
inutile → impossible de comprendre qu'il fallait juste se reconnecter.
**Règles :**
- `isAuthenticated()` doit décoder le JWT et vérifier `exp` (marge 30 s).
- À l'entrée du dashboard : `POST /api/collections/users/auth-refresh` → valide
  ET RENOUVELLE le token (usage hebdo = plus jamais d'expiration) ; si 401 →
  purge + redirect login. En cas d'erreur RÉSEAU, ne pas déconnecter.
- Sur 401/403/404 d'une écriture PocketBase → message « Session expirée ou
  droits insuffisants : reconnectez-vous », jamais le message brut.
- Diagnostic express : `PATCH … -H "Authorization: bidon"` → 404 = update
  protégé ; `GET /records` sans token → 200 = list publique.

### ❌ ERREUR — Dates PocketBase : format « YYYY-MM-DD HH:mm:ss.sssZ » (ESPACE, pas « T »)
**Pattern :** `project.date.split("T")[0]` ne coupait rien → `<input type="date">`
recevait la chaîne entière → champ date VIDE dans le modal d'édition (et valeur
non-ISO renvoyée au submit, parsée par chance sur Chrome).
**Règle :** pour pré-remplir un input date depuis PocketBase : `date.slice(0, 10)`
(robuste aux deux séparateurs). Ne jamais supposer le « T » ISO avec PocketBase.

### ⚠️ SÉCURITÉ — Jamais d'identifiants dans des variables REACT_APP_*
**Pattern :** `.env` contenait `REACT_APP_POCKETBASE_EMAIL`/`_PASSWORD` (non
utilisés par le code — retirés). Tout `REACT_APP_*` RÉFÉRENCÉ est cuit en clair
dans le bundle JS public au build.
**Règle :** les secrets ne vont jamais dans `REACT_APP_*`. L'auth se fait par le
formulaire de login. Vérifié : `frontend/.env` n'est pas tracké par git.
