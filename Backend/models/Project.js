const mongoose = require('mongoose'); // Importer mongoose
const AutoIncrement = require('mongoose-sequence')(mongoose);

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Nom du projet
  date: { type: Date, required: true }, // Date du projet
  completed: { type: Boolean, required: true }, // Statut d'achèvement
  imageUrls: { type: [String], required: true }, // Tableau d'URLs pour les images
  githubUrl: { type: String, required: false }, // URL du dépôt GitHub
  liveUrl: { type: String, required: false }, // URL du site en production
  skillsUsed: { type: [String], required: true }, // Tableau de compétences utilisées
  Resume: { type: String, required: true }, // Resumé du projet
});

// Ajoute l'incrémentation automatique pour le champ projectId
projectSchema.plugin(AutoIncrement, { inc_field: 'projectId' });

module.exports = mongoose.model('Project', projectSchema);