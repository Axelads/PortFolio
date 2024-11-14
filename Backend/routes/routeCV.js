const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer-config');
const { uploadCV, getCV } = require('../controllers/controllerCV');

// Route pour uploader le CV
router.post('/cv', upload.single('file'), uploadCV);

// Route pour télécharger le CV
router.get('/cv', getCV);

module.exports = router;