const mongoose = require('mongoose');


const annonceEmpAdmitsSchema = new mongoose.Schema({
    annonce: {
        type: mongoose.Types.ObjectId,
        ref: "Annonce"
        },
    empAdmis: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    status: {
        type: String,
        enum: ['not-paied', 'paied'],
        default: 'not-paied',
      }
});




module.exports = mongoose.model('AnnonceEmpAdmits', annonceEmpAdmitsSchema);
