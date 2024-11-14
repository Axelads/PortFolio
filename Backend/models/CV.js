const mongoose = require('mongoose');

// Schéma pour le fichier CV
const cvSchema = new mongoose.Schema({
  filename: { type: String, required: true },       // Nom du fichier
  data: { type: Buffer, required: true },           // Contenu du fichier (sous forme de buffer)
  contentType: { type: String, required: true },    // Type de contenu (ex: application/pdf)
});

module.exports = mongoose.model('CV', cvSchema);