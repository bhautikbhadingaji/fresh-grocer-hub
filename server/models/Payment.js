const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
  customerId: { type: String, required: true },
  amountPaid: { type: Number, required: true, min: 0 },
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'other'], default: 'cash' },
  notes: { type: String, default: '' }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Payment', PaymentSchema);
