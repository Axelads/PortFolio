# Animations de logo réalisées — journal anti-répétition

> Tenu par le skill `animation-logo`. Une grammaire principale déjà utilisée est
> **interdite** pour un nouveau logo, sauf demande explicite. Ajouter une ligne à
> chaque livraison.

| Date | Logo / projet | Grammaire principale | Grammaires d'accent | Composant |
| --- | --- | --- | --- | --- |
| 08/10/2026 | Axel Grégoire — olivier sur circuit imprimé + anneau de 36 points (vidéo « CV en mouvement ») | **G02 — Croissance directionnelle** : un front lumineux vert sauge monte des broches du circuit jusqu'au haut du boîtier (le courant), puis l'arbre pousse du tronc vers la cime ; les trois olives éclosent depuis leur pédoncule (back.out) | **G12 — Orbite et satellisation** : les 36 points tournent sur une ellipse inclinée qui ralentit (expo.out), s'arrondit en cercle et se verrouille avec une vague d'éclat autour de l'anneau. Rejouée en clôture, 1,35 × plus vite | `video-cv/main.js` (`construireLogo`), données `video-cv/assets/donnees-logo.json` (tracé potrace, écart 0,007 %) |
| 14/10/2026 | Tableau de bord — « Hublot d'aurore » (marque de l'en-tête et de l'écran de connexion, remplace le point dégradé) | **G07 — Remplissage liquide** : l'aurore monte dans un hublot comme de l'eau, en trois nappes lancées dans leur sens de dérive, dépasse son niveau, retombe et se pose en horizon ; puis un reflet passe sur le verre et une étoile s'allume | Vie au repos (exception demandée par Axel) : trois nappes à trois vitesses dont une à contresens, roulis de 2°, respiration du niveau, lueur qui dérive sous la surface — transform et opacity seulement | `frontend/src/pages/TableauDeBord/composants/HublotAurore.js` + `_hublot.scss` ; planche de choix : artifact `GZox5WCgG35Xd2T2F9GVBL` |

## Détail — Axel Grégoire

**Anatomie.** Pictogramme figuratif en line art : un olivier (tronc, branches, feuilles,
trois olives détachables) planté dans un boîtier de circuit imprimé (pistes et pastilles
qui convergent vers le tronc), entouré d'un anneau de 36 points arc-en-ciel alternant gros
et petits. Direction naturelle : verticale, de la racine vers la cime. Sémantique : quinze
ans de commerce sur les marchés de Provence (Olive et Compagnie) devenus un métier de
développeur — l'arbre pousse littéralement du circuit.

**Pourquoi ces grammaires.** G02 est la seule qui raconte la croissance dans le sens du
logo ; le front lumineux qui traverse d'abord le circuit fait du courant électrique la
sève de l'arbre. G12 traite l'anneau comme des satellites capturés, ce que sa structure
(noyau + 36 points) appelle. Aucune des deux n'avait servi comme grammaire principale
dans les autres projets (G06, G13, G03, G05, G08, G01 déjà prises).

**Écart assumé par rapport au skill.** Pas de prévisualisation à trois propositions :
le logo est ici un moment d'une vidéo livrée d'un bloc (« vas-y à fond »). La vidéo
elle-même sert de pièce à valider ; si la grammaire ne plaît pas, le reveal est isolé
dans `construireLogo(t0, vitesse)` et se remplace sans toucher au reste.

**Rebond.** Dans la même vidéo, les 36 points deviennent les 36 compétences du site
(VS Code retiré) : ils quittent l'anneau, se transforment en puces et se rangent par
catégorie. Le point orange (PocketBase) devient la balle abricot de Lunello, qui reprend
la grammaire validée du logo Lunello (G05 « La balle », journal de `Documents/lunello`).

**Réemploi (08/10/2026).** Les 8 premières secondes (G02 + G12, puis glissement du logo et
titre mot à mot) sont devenues l'écran de chargement du portfolio
(`frontend/public/loading-intro-*.mp4`, `Loading.js`). Le site affiche donc déjà ce reveal
à chaque visite : ne pas le rejouer ailleurs sur le site.

## Détail — Tableau de bord (Hublot d'aurore)

**Anatomie.** Pictogramme abstrait : un disque de verre cerclé (hublot) contenant un
horizon d'eau à deux tons (menthe devant, bleu derrière), une étoile dans le ciel et un
reflet en arc sur le verre. Direction naturelle : verticale (un niveau qui monte).
Sémantique : la direction « Aurore » du tableau de bord (nuit indigo, lueurs menthe et
bleu derrière du verre dépoli), mise dans un cercle — l'aurore du fond devenue de l'eau.

**Pourquoi cette grammaire.** G07 est la seule qui raconte littéralement ce que le
dessin montre : un niveau qui se remplit. Trois pistes ont été dessinées et comparées
(Cadran en G04 morphing génétique, Bento en G10 découpe stencil, Hublot en G07) ;
Axel a retenu le hublot, puis demandé « une eau plus réelle et qui bouge constamment ».

**Écart assumé.** La spécification de motion du tableau de bord exclut toute boucle
permanente au repos ; le hublot est l'exception explicite. Le coût reste nul en
pratique : transformations et opacité sur un vectoriel de 22 px, aucun filtre,
animations mises en pause par le navigateur dans un onglet masqué, rien sous
`prefers-reduced-motion` (le SVG est dessiné dans son état final).

**Eau.** Les surfaces sont générées (`surface()` : houle de période 48 + clapot de
période 16, phase et hauteur propres à chaque nappe), jamais écrites à la main. Dégradé
de profondeur sur la vague de surface (éclat blanc sur les crêtes, menthe, bleu, bleu
profond), crête tracée, lueur elliptique qui dérive, vignette de verre sur le pourtour.
