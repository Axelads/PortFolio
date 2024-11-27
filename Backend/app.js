const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const cvRoutes = require('./routes/routeCV');
const skillRoutes = require('./routes/skills');
const projectRoutes = require('./routes/projectRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();

// Configuration de CORS pour autoriser plusieurs domaines
const allowedOrigins = ['http://localhost:3000', 'http://axelgregoire.fr'];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
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

// Middleware pour analyser les JSON
app.use(express.json());

// Test de la connexion MongoDB
console.log(process.env.MONGO_URI);
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connecté à MongoDB'))
  .catch((error) => console.error('Erreur de connexion à MongoDB:', error));

// Définir les routes principales
app.use('/api/cv', cvRoutes); // Routes pour le CV
app.use('/api/skills', skillRoutes); // Routes pour les compétences
app.use('/api/projects', projectRoutes); // Routes pour les projets
app.use('/api/comments', commentRoutes); // Routes pour les commentaires

// Gestion des erreurs 404
app.use((req, res, next) => {
  if (!req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ message: 'Route non trouvée sur le backend.' });
  }
  next();
});

module.exports = app;
