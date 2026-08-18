# CV en ligne /cv — remplace le PDF statique

Objectif : page /cv magnifique (niveau senior), alimentée par les vraies données
(projets Documents + portfolio), imprimable en PDF via le navigateur (Ctrl+P /
bouton "Télécharger en PDF" → window.print()). Fini le PDF à re-uploader.

## Plan

- [x] 1. Données CV : `frontend/src/assets/Data/DataCvContent.json`
      (identité, pitch, expériences, projets phares réels — ColiPerforma,
      HydraTrack, Boutique de jeux, axelgregoire.fr, BallData, Bots & agents —,
      skills réels, formation, passions, reconversion assumée comme force)
- [x] 2. Page `frontend/src/pages/CV.js` + route `/cv` dans AppRouter
- [x] 3. Styles `frontend/src/styles/pages/_cv.scss` :
      - thème dark ET light via var(--*) (papier volontairement fixe = WYSIWYG print)
      - `@media print` : A4 exact, chrome du site masqué, layout réaffirmé
- [x] 4. Bouton "Télécharger en PDF" → window.print()
- [x] 5. Home.js : bouton "Voir mon CV" → navigate('/cv') (DataCv.json supprimé)
- [x] 6. `npm run build-css`
- [x] 7. Vérification visuelle : captures light + dark + mobile + PDF Puppeteer
      réel — validé par Axel le 18/08/2026 (« c'est parfait »), commit + push

## Itération 2 (retours d'Axel, 18/08)

- [x] BallData retiré ; ajoutés : saveurs-du-marche.fr (Epices2), Vigie
      (audit sécurité GitHub/.apk/.ipa), RolistesUnis.fr (point & click),
      BreakCrew (app ciné) — 6 projets page 1 + 3 en « suite » page 2
- [x] Logo de chaque projet (redimensionnés 160px → public/images/cv/,
      script sharp dans le scratchpad) ; icône app carrée pour ColiPerforma
- [x] Fond SVG : échos d'aurora (blobs flous + lignes de contour menthe)
      en coins de chaque feuille, print-safe
- [x] Sceau de cire menthe avec l'olivier du logo (SVG inline + PNG
      transparent du motif) en bas de chaque page
- [x] Panneau latéral teinté menthe ; « (en production) » retiré ;
      email avec césure <wbr> après le @
- [x] Bug corrigé : le garde z-index écrasait position:absolute du footer

## Review

- Direction validée par Axel : « document premium » (2 feuilles A4 posées sur le
  fond du site, WYSIWYG écran = PDF), 2 pages.
- Données 100 % réelles : ancien CV PDF (parcours commerce/banque), scan des
  package.json de ~20 projets Documents (ColiPerforma ML Kit, HydraTrack Skia,
  BoutiqueJeux R3F, bots Telegram/Discord, SDK Anthropic…).
- Typo dédiée au document : Spectral / Archivo / Fragment Mono (Google Fonts,
  ajoutées dans public/index.html).
- Bug attrapé par le test PDF : la media query mobile s'appliquait à
  l'impression (largeur papier ≈ 794px) → `@media screen and` + réaffirmation
  du layout dans `@media print` (leçon consignée dans lessons.md).
- Détecteur design impeccable : 0 finding. Revue de finition par sous-agent
  volontairement remplacée par la validation visuelle d'Axel (économie du
  forfait, demande explicite de voir avant push).
- Validé et pushé le 18/08/2026. Encore ouvert (sans bloquer) : trancher
  GitHub Axelads vs Ostiic dans le JSON-LD du site, et LinkedIn avec/sans
  tiret — le CV utilise Axelads + axelgregoire (source : ancien CV).
