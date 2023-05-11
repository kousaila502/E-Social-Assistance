const mongoose = require('mongoose');


const annonceEmpInscritsSchema = new mongoose.Schema({
    annonce: {
        type: mongoose.Types.ObjectId,
        ref: "Annonce"
        },
    emplInscrits: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    status: {
        type: String,
        enum: ['pending', 'rejected'],
        default: 'pending',
      }
});




module.exports = mongoose.model('AnnonceEmpInscrits', annonceEmpInscritsSchema);
