const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  nom: {
    type: String
  },
  text:{
    type: String
  }
},
{ timestamps: true });




module.exports = mongoose.model('Article', articleSchema);
