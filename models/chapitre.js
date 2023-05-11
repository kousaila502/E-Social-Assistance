const mongoose = require('mongoose');

const chapitreSchema = new mongoose.Schema({
  nom: {
    type: String,
  },
  sous_chapitre: {
    type: mongoose.Types.ObjectId,
    ref: 'SousChapitre'
  },
  status: {
    type: String,
    enum: ['active', 'deactive'],
    default: 'active',
  },
},
{ timestamps: true });




module.exports = mongoose.model('Chapitre', chapitreSchema);
