const mongoose = require('mongoose');

const paimentSchema = new mongoose.Schema({
  mode: {
    type: String,
    required: true
  },
  nPiece: {
    type: Number,
    required: true 
  },
  source: {
    type: {
      type: String,
      enum: ['User', 'BudgetPool'],
      required: true
    },
    id: {
      type: mongoose.Types.ObjectId,
      required: true
    },
    ref: {
      type: String,
      required: true
    }
  },
  destination: {
    type: {
      type: String,
      enum: ['User', 'BudgetPool'],
      required: true
    },
    id: {
      type: mongoose.Types.ObjectId,
      required: true
    },
    ref: {
      type: String,
      required: true
    }
  },
  demande: {
    type: mongoose.Types.ObjectId,
    ref: Demande
  }
},
{ timestamps: true });





module.exports = mongoose.model('Paiment', paimentSchema);
