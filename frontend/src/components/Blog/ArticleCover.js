import React from "react";

// Couverture 100 % CSS : dégradé par catégorie + glyphe.
// Zéro image à stocker, rendu identique dans les deux thèmes.
const GLYPHS = {
  ia: "IA",
  javascript: "JS",
  react: "⚛",
  css: "{ }",
  outils: ">_",
};

const ArticleCover = ({ category }) => (
  <div className={`article-cover article-cover--${category}`} aria-hidden="true">
    <span className="article-cover__glyph">{GLYPHS[category] || "</>"}</span>
  </div>
);

export default ArticleCover;
