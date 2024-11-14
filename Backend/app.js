const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const cvRoutes = require('./routes/routeCV');
const app = express();

// Configuration de CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use('/api', cvRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connecté à MongoDB'))
  .catch(error => console.error('Erreur de connexion à MongoDB:', error));

  const skillRoutes = require('./routes/skills');
app.use('/api', skillRoutes);

module.exports = app;