const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  username: { type: String, required: true },
  poste: { type: String, required: true },
  commentary: { type: String, required: true },
  urlImage: { type: String, required: true },
});

module.exports = mongoose.model('Comment', commentSchema);