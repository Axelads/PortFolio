const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ['Completed', 'In Progress'], required: true },
  level: { type: Number, required: true }, // Level from 0 to 100
  url: { type: String, required: true } // URL for the skill logo
});

module.exports = mongoose.model('Skill', skillSchema);