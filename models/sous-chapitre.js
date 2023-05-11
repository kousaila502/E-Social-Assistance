const mongoose = require('mongoose');

const sousChapitreSchema = new mongoose.Schema({
  nom: {
    type: String,
  },
  article: [{
    type: mongoose.Types.ObjectId,
    ref: 'Article'
  }],
  status: {
    type: String,
    enum: ['active', 'deactive'],
    default: 'active',
  },
},
{ timestamps: true });




module.exports = mongoose.model('SousChapitre', sousChapitreSchema);
