const mongoose = require('mongoose');

const demandeSchema = new mongoose.Schema({
  description: {
    type: String,
  },
  montant: {
    type: Number 
  },
  status: {
    type: String,
    enum: ['pending', 'rejected', 'accepted', 'paied'],
    default: 'pending',
  },
  files: [{
    type: String
  }],
  date: Date,
  user: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  cacher: {
    type: Boolean,
    default: false
  }
});




module.exports = mongoose.model('Demande', demandeSchema);
