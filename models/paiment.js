const mongoose = require('mongoose');
const User = require('./user')

const paimentSchema = new mongoose.Schema({
  mode: {
    type: String,
  },
  nPiece: {
    type: Number 
  },
  date: Date,
  user: {
    type: mongoose.Schema.objectId,
    ref: User
  },
  demande: {
    type: mongoose.Schema.objectId,
    ref: Demande
  },
  pret: {
    type: mongoose.Schema.objectId,
    ref: Pret
  }
});




module.exports = mongoose.model('Paiment', paimentSchema);
