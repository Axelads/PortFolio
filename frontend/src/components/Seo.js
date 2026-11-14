import React from 'react';
import { Helmet } from 'react-helmet-async';

export const SITE_URL = 'https://axelgregoire.fr';
export const IMAGE_PARTAGE = `${SITE_URL}/images/partage/axel-gregoire-1200x630.png`;

// Image de partage 1200×630 d'un article selon sa catégorie (rendues par scripts/generer-images-partage.mjs).
export const imagePartageBlog = (category) =>
  `${SITE_URL}/images/partage/blog-${['ia', 'javascript', 'react', 'css', 'outils'].includes(category) ? category : 'outils'}-1200x630.png`;

// Titre d'un article : suffixe de marque seulement si le titre reste court (Google tronque vers 580 px).
export const titreArticle = (titre) => (titre.length <= 45 ? `${titre} | Axel Grégoire` : titre);

/**
 * Balises <head> d'une page, en un seul endroit : title, description, canonical, Open Graph, Twitter, JSON-LD,
 * noindex. Les balises communes au site (og:locale, og:site_name, twitter:card, Person, WebSite) restent dans
 * public/index.html.
 *
 * Côté serveur, public/index.php émet les mêmes balises (marquées data-ssr) dans le HTML brut pour les robots et
 * les aperçus de partage sans JavaScript ; App.js les retire au montage et Helmet prend le relais. La table PAGES
 * d'index.php doit rester alignée avec les <Seo> des pages statiques.
 */
const Seo = ({
  title,
  description,
  path,
  type = 'website',
  image = IMAGE_PARTAGE,
  imageAlt = 'Axel Grégoire, développeur web full stack',
  noindex = false,
  jsonLd,
  children,
}) => {
  const url = path ? `${SITE_URL}${path}` : null;
  const blocs = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet>
      <title>{title}</title>
      {description ? <meta name="description" content={description} /> : null}
      {noindex ? <meta name="robots" content="noindex, nofollow" /> : null}
      {url && !noindex ? <link rel="canonical" href={url} /> : null}
      <meta property="og:title" content={title} />
      {description ? <meta property="og:description" content={description} /> : null}
      <meta property="og:type" content={type} />
      {url ? <meta property="og:url" content={url} /> : null}
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={imageAlt} />
      <meta name="twitter:title" content={title} />
      {description ? <meta name="twitter:description" content={description} /> : null}
      <meta name="twitter:image" content={image} />
      {blocs.map((bloc, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(bloc)}
        </script>
      ))}
      {children}
    </Helmet>
  );
};

export default Seo;
