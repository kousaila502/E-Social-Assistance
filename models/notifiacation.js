const mongoose = require('mongoose');
const User = require('./user');
const Demande = require('./demande');
const Annonce = require('./annonce');
const Pret = require('./pret');


const notificationSchema = new mongoose.Schema({
  description: {
    type: String,
  },
  anounce: {
    type: mongoose.Schema.objectId,
    ref: Annonce
  },
  demande: {
    type: mongoose.Schema.objectId,
    ref: Demande
  },
  pret: {
    type: mongoose.Schema.objectId,
    ref: Pret
  },
  user: {
    type: mongoose.Schema.objectId,
    ref: User
  }
});




module.exports = mongoose.model('Notification', notificationSchema);
