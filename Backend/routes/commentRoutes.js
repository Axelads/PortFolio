const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');


router.post('/', async (req, res) => {
  try {
    const { username, poste, commentary, urlImage } = req.body;
    const newComment = new Comment({ username, poste, commentary, urlImage });
    await newComment.save();
    res.status(201).json(newComment);
  } catch (error) {
    res.status(400).json({ message: 'Erreur lors de l’ajout du commentaire', error });
  }
});

router.get('/', async (req, res) => {
  try {
    const comments = await Comment.find();
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des commentaires' });
  }
});

module.exports = router;