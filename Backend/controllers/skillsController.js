const Skill = require('../models/Skill');

// Récupérer toutes les compétences
exports.getSkills = async (req, res) => {
  try {
    const skills = await Skill.find();
    res.status(200).json(skills);
  } catch (error) {
    console.error('Erreur lors de la récupération des compétences :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des compétences', error });
  }
};

// Ajouter une compétence
exports.addSkill = async (req, res) => {
  try {
    const { name, status, level, url } = req.body;

    // Validation des données
    if (!name || !status || !level || !url) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    const newSkill = new Skill({ name, status, level, url });
    await newSkill.save();
    res.status(201).json({ message: 'Compétence ajoutée avec succès', skill: newSkill });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la compétence :', error);
    res.status(400).json({ message: 'Erreur lors de l\'ajout de la compétence', error });
  }
};
