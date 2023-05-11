const mongoose = require('mongoose');


const annonceSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  deadline:  {
    type: Date,
    required: true
  }
},
{ timestamps: true });




module.exports = mongoose.model('Annonce', annonceSchema);
