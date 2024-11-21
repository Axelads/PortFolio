const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const cvRoutes = require('./routes/routeCV');
const skillRoutes = require('./routes/skills');
const projectRoutes = require('./routes/projectRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();



// Configuration de CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware pour JSON
app.use(express.json());

console.log(process.env.MONGO_URI);
// Connexion à MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Connecté à MongoDB'))
  .catch((error) => console.error('Erreur de connexion à MongoDB:', error));

// Routes
app.use('/api/cv', cvRoutes); // Routes pour le CV
app.use('/api/skills', skillRoutes); // Routes pour les compétences
app.use('/api/projects', projectRoutes); // Routes pour les projets
app.use('/api/comments', commentRoutes); // Routes pour les commentaires

module.exports = app;