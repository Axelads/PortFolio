const multer = require('multer');
const path = require('path');

// Configuration de multer pour enregistrer les fichiers dans un dossier local
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'images')); // Enregistre dans le dossier "images"
  },
  filename: (req, file, cb) => {
    cb(null, 'cv.pdf'); // Nom du fichier, remplace tout fichier existant
  }
});

const upload = multer({ storage });

module.exports = upload;