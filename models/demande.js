const mongoose = require('mongoose');

const demandeSchema = new mongoose.Schema({
  description: {
    type: String,
  },
  field:{
    type: {
      type: String,
      enum: ['Chapitre', 'Annonce'],
      required: true,
    },
    id: {
      type: mongoose.Types.ObjectId,
      required: true,
      refPath: 'field.type',
    }
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
  user: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  paiment: {
    type: mongoose.Types.ObjectId,
    ref: 'Paiment'
  },
  motif: {
    type: String
  }
},
{ timestamps: true });




module.exports = mongoose.model('Demande', demandeSchema);
