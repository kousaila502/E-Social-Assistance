const mongoose = require('mongoose');

const paimentSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
    },
    nPiece: {
      type: Number,
    },
    date: Date,
    source: {
      type: {
        type: String,
        enum: ['User', 'BudgetPool'],
        required: true,
      },
      id: {
        type: mongoose.Types.ObjectId,
        required: true,
        refPath: 'source.type',
      },
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
  },
  { timestamps: true }
);








module.exports = mongoose.model('Paiment', paimentSchema);
