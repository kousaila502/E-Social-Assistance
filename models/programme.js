const mongoose = require('mongoose');

const programmeSchema = new mongoose.Schema({
  nom: {
    type: String,
  },
  chapitre: {
    type: mongoose.Types.ObjectId,
    ref: 'Chapitre'
  },
  status: {
    type: String,
    enum: ['active', 'deactive'],
    default: 'active',
  },
},
{ timestamps: true });




module.exports = mongoose.model('Programme', programmeSchema);
