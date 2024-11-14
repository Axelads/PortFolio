const express = require('express');
const router = express.Router();
const Skill = require('../models/Skill');

router.get('/skills', async (req, res) => {
  try {
    const skills = await Skill.find();
    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des compétences' });
  }
});

module.exports = router;