const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  montant: {
    type: Number,
    default:0,
    required:true
  }
});




module.exports = mongoose.model('Budget', budgetSchema);
