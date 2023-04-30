const mongoose = require('mongoose');
const User = require('./user');
const Demande = require('./demande');
const Pret = require('./pret');

const pretSchema = new mongoose.Schema({
  montant: {
    type: Number 
  },
  etat: {
    type: Boolean,
    default: false
  },
  date: Date,
  user: {
    type: mongoose.Schema.objectId,
    ref: User
  }
});




module.exports = mongoose.model('Pret', pretSchema);
