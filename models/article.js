const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  text:{
    type: String,
    required: true
  }
},
{ timestamps: true });




module.exports = mongoose.model('Article', articleSchema);
