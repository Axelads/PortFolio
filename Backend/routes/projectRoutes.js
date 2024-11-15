const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// Route pour ajouter un projet
router.post('/', projectController.addProject);

// Route pour récupérer tous les projets
router.get('/', projectController.getAllProjects);

// Route pour récupérer un projet par ID
router.get('/:id', projectController.getProjectById);

module.exports = router;