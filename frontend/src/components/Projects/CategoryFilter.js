import React from "react";

const CATEGORIES = [
  { id: "all", name: "Tous", icon: "🎯" },
  { id: "site-web", name: "Site Web", icon: "🌐" },
  { id: "application-mobile", name: "Application Mobile", icon: "📱" },
  { id: "outils-scripts", name: "Outils & Scripts", icon: "⚙️" },
];

const CategoryFilter = ({ activeCategory, onCategoryChange }) => {
  return (
    <div className="category-filter">
      <div className="filter-pills">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            className={`filter-pill ${activeCategory === category.id ? "active" : ""}`}
            onClick={() => onCategoryChange(category.id)}
            aria-pressed={activeCategory === category.id}
          >
            <span className="pill-icon">{category.icon}</span>
            <span className="pill-text">{category.name}</span>
            <span className="pill-glow"></span>
          </button>
        ))}
      </div>
    </div>
  );
};

export { CATEGORIES };
export default CategoryFilter;
