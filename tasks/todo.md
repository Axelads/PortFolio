# Blog auto-alimenté /blog (coût API : 0 €) — plan approuvé le 2026-08-03

Génération par routine Claude planifiée (abonnement, pas l'API facturée) → POST vers
`/api/blog/publish` (Vercel) → PocketBase `articles` → frontend `/blog` + onglet admin.
Décisions : catégories Pack dev (ia/javascript/react/css/outils), admin oui, 2×/sem (mar+ven ~9h Paris).

## Tâches

### Phase 0 — Hygiène
- [x] `chatbot-api/.gitignore` (node_modules, .vercel, .env*)
- [x] Supprimer `chatbot-api/package-lock.json` (désynchronisé)
- [x] Fix URL fallback morte dans `Chatbot.js` (chatbot-api-tan)

### Phase 1 — PocketBase
- [x] Sonder la version PB → **moderne (≥ 0.23, format "fields")** confirmé sans identifiants
- [x] `chatbot-api/scripts/setup-blog-collection.js` (double format, idempotent, --smoke)
- [x] Collection créée (script exécuté avec les creds superuser du .env — format moderne, smoke OK)
- [x] Utilisateur `blog-bot` opérationnel (mot de passe réinitialisé + auth vérifiée)

### Phase 2 — Endpoint publication
- [x] `chatbot-api/api/blog/publish.js` (Bearer, validation stricte, slug dedup testé accents FR, PB auth)
- [x] `chatbot-api/vercel.json` (functions blog, pas de cron Vercel)

### Phase 4 — SEO
- [x] `chatbot-api/api/blog/sitemap.js`
- [x] `chatbot-api/api/blog/rss.js`
- [x] `frontend/public/robots.txt` (ligne Sitemap cross-domaine)
- [x] `frontend/public/sitemap.xml` (+ /blog)
- [x] `frontend/public/index.html` (link rel=alternate RSS)

### Phase 5 — Frontend /blog
- [x] `services/pocketbase.js` : export getAuthHeader + parsePbError
- [x] `services/blog.js` (pagination réelle + CRUD admin)
- [x] `utils/seo.js` (stripHtml)
- [x] `components/Blog/ArticleCover.js` + `ArticleCard.js`
- [x] `pages/Blog.js` (Helmet, filtres, grille, Charger plus, GSAP + garde reduced-motion JS)
- [x] `pages/BlogArticle.js` (Helmet + JSON-LD BlogPosting, DOMPurify whitelist, sources, À lire aussi)
- [x] `AppRouter.js` (/blog, /blog/:slug)
- [x] `Header.js` (Blog desktop + drawer mobile is-active, --i réindexés)
- [x] `styles/pages/_blog.scss` + import styles.scss + `npm run build-css`

### Phase 6 — Admin
- [x] `components/Admin/ArticlesPanel.js` (table, toggle Publié/Brouillon, modal TipTap key-remount, suppression)
- [x] `AdminDashboard.js` (onglets Projets/Articles)
- [x] `_admin.scss` (.admin-tabs, .status-toggle) + build-css

### Phase 7 — Skill
- [x] `.claude/skills/gsap-scrolltrigger/SKILL.md`

### Vérifications & déploiement
- [x] `npm run build-css` sans erreur nouvelle (seuls warnings darken() préexistants)
- [x] `npm run build` → **Compiled successfully** (+4,1 kB JS / +1,3 kB CSS gzip)
- [x] Captures /blog light + dark desktop + mobile + drawer (Blog actif, stagger OK)
- [x] Routine créée **désactivée** : `trig_01DHqZrxGgganTmPx3rPsR91` (cron 0 7 * * 2,5 UTC)
- [x] 4 variables d'env Vercel (Axel) + déploiement `npx vercel --prod` (fait après login Axel)
- [x] Endpoints prod testés : sitemap 200, RSS 200, publish 401 sans token / 400 payload invalide
- [x] Environnement cloud « blog » créé (egress autorisé vers Koyeb + Vercel — « Default » bloquait)
- [x] Test bout en bout réussi : 1er article publié par la routine (« Claude Opus 5 : ce qui
      change vraiment pour les devs sur l'API », 1288 mots, UTF-8 propre, whitelist respectée)
- [x] Routine ACTIVÉE — prochain run vendredi 7 août ~9h Paris
- [ ] (Axel) upload FTP de `frontend/build/` vers o2switch — dernière étape restante
- [x] Review + lessons.md

## Review

**Fait.** Chaîne complète codée et vérifiée localement : script de création de la collection
(PB moderne confirmé par sonde des endpoints d'auth, replis legacy conservés), endpoint
`/api/blog/publish` (Bearer + validation stricte + slugify accents testé + dedup slug),
sitemap + RSS dynamiques, pages `/blog` et `/blog/:slug` (SEO Helmet + JSON-LD, DOMPurify
whitelist, pagination réelle — une première dans le code —, GSAP avec garde reduced-motion),
onglet admin Articles (réutilise table/modals/TipTap existants), skill GSAP adapté au vrai
stack. Preuves : build prod « Compiled successfully », captures des 2 thèmes + mobile.

**Choix structurants.** Génération à 0 € via routine Claude planifiée (abonnement) au lieu
de l'API facturée — exigence d'Axel en cours de plan ; l'endpoint Vercel ne contient aucun
appel Anthropic. Couvertures d'articles 100 % CSS (dégradé par catégorie) : rien à stocker.
`.article-body` = variante rich-text aux variables CSS car `.project-resume-html` est
hardcodé clair.

**Reste (5 min, secrets uniquement — voir résumé de session)** : utilisateur `blog-bot`
PocketBase, exécution du script setup, 4 env Vercel (PB_URL, PB_SERVICE_EMAIL,
PB_SERVICE_PASSWORD, BLOG_PUBLISH_SECRET), déploiement Vercel, FTP du build, puis test
« run now » de la routine et activation.
