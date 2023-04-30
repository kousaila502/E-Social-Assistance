const mongoose = require('mongoose');

const recetteSchema = new mongoose.Schema({
  description: {
    type: String,
  },
  montant: {
    type: Number 
  },
  date: Date
});




module.exports = mongoose.model('Recette', recetteSchema);
