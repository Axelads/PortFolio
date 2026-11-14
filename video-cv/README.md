# CV en mouvement — vidéo motion design

Vidéo de présentation d'Axel Grégoire (86 s, 1920 × 1080, 60 i/s, son stéréo 48 kHz).
Tout est généré localement, sans service payant : page HTML + timeline GSAP, rendu image
par image avec Puppeteer, bande-son synthétisée en Python.

## Refaire la vidéo

```bash
npm install
node scripts/preparer-logo.mjs      # seulement si le logo change (vectorisation + vérif ≤ 1,5 %)
node scripts/rendre.mjs             # images → out/video-muette.mp4 (+ out/reperes.json)
python scripts/bande-son.py         # out/reperes.json → out/bande-son.wav
ffmpeg -i out/video-muette.mp4 -i out/bande-son.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart out/axel-gregoire-cv.mp4
ffmpeg -i out/axel-gregoire-cv.mp4 -c:v libx264 -preset slow -crf 21 -tune film -pix_fmt yuv420p -c:a copy -movflags +faststart out/axel-gregoire-cv-web.mp4
```

## Retoucher

- `data.js` : tous les textes (parcours, compétences, projets, Lunello, citation, contacts).
- `main.js` : la timeline, scène par scène (S1 intro … S8 clôture). Chaque temps est en secondes ;
  la musique est à 120 BPM, une mesure = 2 s : garder les événements forts sur les temps.
- `index.html` : styles et mise en page.
- Aperçu d'un instant : `node scripts/apercu.mjs 12.5 44.8 --sortie=out/planche.jpg`.
- Lecture temps réel dans le navigateur (sans son) : servir le dossier et ouvrir `index.html?jouer`.

Règle du rendu : tout l'état visuel dépend du seul temps `t` (`window.__seek(t)`). Pas
d'animation CSS, pas de callback GSAP, aléatoire à graine fixe : deux rendus sont identiques.
