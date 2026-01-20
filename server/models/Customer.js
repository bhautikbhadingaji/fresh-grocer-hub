const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    index: true
  },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '' }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Customer', CustomerSchema);
