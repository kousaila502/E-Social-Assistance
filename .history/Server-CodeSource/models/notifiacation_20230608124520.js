const mongoose = require('mongoose');
const User = require('./user');
const Demande = require('./demande');
const Annonce = require('./annonce');


const notificationSchema = new mongoose.Schema({
  description: {
    type: String,
  },
  anounce: {
    type: mongoose.Types.ObjectId,
    ref: 'Annonce'
  },
  demande: {
    type: mongoose.Types.ObjectId,
    ref: 'Demande'
  },
  user: {
    type: mongoose.Types.ObjectId,
    ref: 'User'
  },
  seen: {
    type: Boolean,
    default: false
  }
});




module.exports = mongoose.model('Notification', notificationSchema);
