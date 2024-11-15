const Cv = require('../models/CV'); // Vérifie que le modèle est correctement lié

// Ajouter un nouveau CV
exports.addCV = async (req, res) => {
  try {
    const { username, url } = req.body;

    if (!username || !url) {
      return res.status(400).json({ message: 'Le champ username et url sont requis.' });
    }

    const newCV = new Cv({ username, url });
    await newCV.save();

    res.status(201).json({ message: 'CV ajouté avec succès', cv: newCV });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du CV :', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du CV', error });
  }
};

// Récupérer le dernier CV ajouté
exports.getCV = async (req, res) => {
  try {
    const cv = await Cv.findOne().sort({ date: -1 }); // Récupère le plus récent
    if (!cv) {
      return res.status(404).json({ message: 'Aucun CV trouvé.' });
    }

    res.status(200).json(cv);
  } catch (error) {
    console.error('Erreur lors de la récupération du CV :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération du CV', error });
  }
};
