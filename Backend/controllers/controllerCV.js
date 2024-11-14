const path = require('path');
const fs = require('fs');

// Fonction pour uploader le CV
const uploadCV = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier téléchargé' });
  }
  res.status(200).json({ message: 'Fichier uploadé avec succès' });
};

// Fonction pour télécharger le CV
const getCV = (req, res) => {
  const filePath = path.join(__dirname, '..', 'images', 'cv.pdf');
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Fichier introuvable' });
  }
  res.sendFile(filePath);
};

module.exports = { uploadCV, getCV };