const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  montant: {
    type: Number 
  }
});




module.exports = mongoose.model('Budget', budgetSchema);
