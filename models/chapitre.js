const mongoose = require('mongoose');

const chapitreSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  sous_chapitre: [{
    type: mongoose.Types.ObjectId,
    ref: 'SousChapitre'
  }],
  status: {
    type: String,
    enum: ['active', 'desactive'],
    default: 'active',
  },
  budgetPool: {
    type: mongoose.Types.ObjectId,
    ref: 'BudgetPool'
  }
},
{ timestamps: true });




module.exports = mongoose.model('Chapitre', chapitreSchema);
