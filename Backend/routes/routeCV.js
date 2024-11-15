const express = require('express');
const router = express.Router();
const { addCV, getCV } = require('../controllers/controllerCV'); // Assure-toi que le chemin est correct

// Route pour ajouter un CV
router.post('/', addCV);

// Route pour récupérer le dernier CV
router.get('/', getCV);

module.exports = router;