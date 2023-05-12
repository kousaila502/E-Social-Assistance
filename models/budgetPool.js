const mongoose = require('mongoose');

const budgetPoolSchema = new mongoose.Schema({
  montant: {
    type: Number,
    default:0,
    required:true
  },
  description: {
    type: String,
    required: true
  },
  remaining: {
    type: Number,
    required: true,
    default: function () {
      return this.montant;
    },
  },
});




module.exports = mongoose.model('BudgetPool', budgetPoolSchema);
