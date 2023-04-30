const mongoose = require('mongoose');
const User = require('./user');
const Pret = require('./pret');

const rembourssementSchema = new mongoose.Schema({
  nMois: {
    type: Number,
  },
  montant: {
    type: Number 
  },
  paye: {
    type: Number 
  },
  date: Date,
  deadline: Date,
  user: {
    type: mongoose.Schema.objectId,
    ref: User
  },
  pret: {
    type: mongoose.Schema.objectId,
    ref: Pret
  }
});




module.exports = mongoose.model('Rembourssement', rembourssementSchema);
