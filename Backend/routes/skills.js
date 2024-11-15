const express = require('express');
const router = express.Router();
const skillsController = require('../controllers/skillsController');

// Récupérer toutes les compétences
router.get('/', skillsController.getSkills);

// Ajouter une compétence
router.post('/', skillsController.addSkill);

module.exports = router;