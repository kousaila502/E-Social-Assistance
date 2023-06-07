const mongoose = require('mongoose');

const sousChapitreSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  article: [{
    type: mongoose.Types.ObjectId,
    ref: 'Article'
  }],
  chapitre: {
    type: mongoose.Types.ObjectId,
    ref: 'Chapitre'
  },
  status: {
    type: String,
    enum: ['active', 'desactive'],
    default: 'active',
  },
},
{ timestamps: true });




module.exports = mongoose.model('SousChapitre', sousChapitreSchema);
