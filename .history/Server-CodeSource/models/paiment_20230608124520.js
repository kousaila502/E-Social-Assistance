const mongoose = require('mongoose');

const paimentSchema = new mongoose.Schema(
  {
    acceptedMontant: {
      type: String,
      required: true
    },
    source: {
      type: mongoose.Types.ObjectId,
      ref: 'BudgetPool'
    },
    destination: {
      type: {
        type: String,
        enum: ['User', 'BudgetPool'],
        required: true,
      },
      id: {
        type: mongoose.Types.ObjectId,
        required: true,
        refPath: 'destination.type',
      },
    },
    demande: {
      type: mongoose.Types.ObjectId,
      ref: 'Demande',
    },
    files: [{
      type: String
    }],
  },
  { timestamps: true }
);








module.exports = mongoose.model('Paiment', paimentSchema);
