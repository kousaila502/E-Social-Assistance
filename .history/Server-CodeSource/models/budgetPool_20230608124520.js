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
  field: {
    type: {
      type: String,
      enum: ['Chapitre', 'Annonce'],
      required: true,
    },
    id: {
      type: mongoose.Types.ObjectId,
      required: true,
      refPath: 'field.type',
    },
  }
  },
});




module.exports = mongoose.model('BudgetPool', budgetPoolSchema);
