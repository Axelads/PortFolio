const mongoose = require('mongoose');

const cvSchema = new mongoose.Schema({
  username: { type: String, required: true }, // Nom de l'utilisateur
  url: { type: String, required: true }, // URL pour accéder au CV hébergé
  date: { type: Date, default: Date.now }, // Date de l'ajout du CV
});

module.exports = mongoose.model('CV', cvSchema);