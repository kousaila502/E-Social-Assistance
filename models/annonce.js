const mongoose = require('mongoose');
const User = require('./user')

const annonceSchema = new mongoose.Schema({
  description: {
    type: String,
  },
  date: Date,
  deadline: Date,
  emplInscrit: {
    type: mongoose.Schema.objectId,
    ref: User
  },
  emplAdmis: {
    type: mongoose.Schema.objectId,
    ref: User
  }
});




module.exports = mongoose.model('Annonce', annonceSchema);
