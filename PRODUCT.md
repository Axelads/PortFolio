# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Deux publics de même poids (confirmé par Axel le 20/11/2026), qui doivent chacun trouver leur porte dès le haut de page :

- **Recruteurs** d'équipes tech (recherche de CDI) : ils veulent en quelques secondes le CV, la stack réelle, la
  disponibilité et une preuve de niveau (vidéo CV, projets livrés).
- **Clients** : petites structures, commerces, associations et indépendants (Var, PACA et à distance), plus une
  enseigne nationale. Ils veulent un interlocuteur unique et identifié, des exemples proches de leur cas, et un moyen
  simple de demander un devis.

## Product Purpose

axelgregoire.fr est le portfolio personnel d'Axel Grégoire, développeur web et mobile. Il sert à la fois la recherche
de CDI et la prospection freelance. Le succès : un recruteur trouve CV et disponibilité sans chercher, un client
comprend ce qu'Axel fait très bien, en voit la preuve, et demande un devis.

## Positioning

Une personne, pas une pseudo-agence : tout s'écrit en « je ». Quinze ans de commerce (gérant d'une SARL, marchés de
Provence) puis développeur depuis 2023, qui conçoit et livre seul, du design au déploiement : sites, applications
mobiles, back-offices, outils et automatisations. Chaque projet est pensé au cas par cas ; c'est le contraste entre
les projets qui le démontre.

## Operating Context

- Site React (Create React App) + SCSS, contenu des projets lu en direct dans PocketBase, pages pré-rendues au build
  pour les robots, hébergé chez o2switch.
- Thème clair et sombre (`[data-theme]`), les deux toujours tenus.
- Visité sur téléphone comme sur ordinateur ; les clients arrivent souvent par Google (fiche Google Business).

## Capabilities and Constraints

- **Pas de tarifs affichés** : chaque offre mène à une demande de devis (décision d'Axel, 20/11/2026).
- À garder tels quels : l'intro vidéo de chargement (logo qui pousse du circuit), les projets présentés dans un
  ordinateur qui s'ouvre et sur tablette + téléphone, le chatbot « Chat interactif d'Axel », l'illustration pop art
  « Keep smiling », la section des projets en appareils (ordinateur qui s'ouvre, tablette + téléphone) avec les
  outils et scripts, le carrousel d'avis au-dessus du pied de page, la vague entre le contenu et le pied de page, la
  vague de lettres de la signature de l'en-tête (Axel, 20/11/2026).
- Stack réelle : Next.js est le cadre des sites clients (Honn'Eure, Harmovità, Abadias, Saveurs du Marché,
  FantasyMythos) ; React seul pour ce portfolio et RolistesUnis.
- Démonstrations reprises de projets livrés : le feu d'artifice (Abadias Artifices), le dé à 20 faces en 3D
  (FantasyMythos), l'arbre de vie en particules (Harmovità).
- JavaScript uniquement, jamais TypeScript.

## Brand Commitments

- Nom : Axel Grégoire. Signature : « développeur web & mobile ».
- Logo : un olivier en line art planté dans un boîtier de circuit imprimé, entouré d'un anneau de 36 points
  arc-en-ciel. Identité gardée et resserrée, pas remplacée.
- **Palette gardée telle quelle** (demande d'Axel, 20/11/2026) : vert menthe #8BC7B1 (marque), bleu nuit #00334d,
  bleu #4a90e2 ; thème sombre #1a1a2e / #16213e / #0f3460. La refonte resserre les rôles (une couleur pour les
  actions), la typographie, l'espace et la hiérarchie, sans changer les couleurs.
- Voix : « je », phrases courtes, des faits plutôt que des qualificatifs, chiffrés dès que possible.
- À ne jamais produire : le look « template IA générique » que tout le monde reconnaît.
- Les clients se montrent par le bandeau de logos, jamais résumés en accroche (« 8 clients, d'une association à
  Intermarché » refusé par Axel le 20/11/2026).

## Evidence on Hand

- 27 projets dans PocketBase (collection `projects`), dont des sites en ligne : saveurs-du-marche.fr, honneure.fr,
  harmovita.fr, abadias-artifices.fr, clean-project.fr, rolistesunis.fr, nivo-stock.fr, lunello.family.
- Clients du bandeau (`frontend/src/components/Clients/clients.js`) : Harmovità, Intermarché, Honn'Eure, Abadias
  Artifices, Lunello, Saveurs du Marché, Rune, Clean-Project.
- Fiche Google : note 5,0 sur 5 avis au 19/11/2026 (`DataNoteGoogle.json`, relu par l'API).
- Vidéo CV en motion design (86 s), CV imprimable (`/cv`), blog alimenté automatiquement, recommandations (`/Avis`).
- À ne pas inventer : chiffres de trafic, scores Lighthouse, nombre d'apps publiées sur les stores, délais ou
  résultats clients tant qu'ils ne sont pas mesurés ou confirmés par Axel.

## Product Principles

1. Un profil senior se reconnaît à ce qu'il choisit de ne pas montrer : hiérarchiser, sélectionner, couper.
2. Prouver plutôt qu'affirmer : chaque savoir-faire se montre en marche, ancré dans un projet réel.
3. Deux portes claires, recruteurs et clients, sans que l'une n'écrase l'autre.
4. Un site lent ou inaccessible contredit le discours : performance et accessibilité sont des preuves.

## Accessibility & Inclusion

`prefers-reduced-motion` respecté partout (démos figées sur une image), contrastes suffisants dans les deux thèmes,
navigation complète au clavier.
