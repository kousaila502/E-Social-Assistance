const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  text:{
    type: String,
    required: true
  },
  sous_chapitre: {
    type: mongoose.Types.ObjectId,
    ref: 'SousChapitre'
  }
},
{ timestamps: true });




module.exports = mongoose.model('Article', articleSchema);
