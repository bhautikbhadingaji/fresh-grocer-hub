const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number },
  total: { type: Number },
  customerName: { type: String, default: '' },
  paymentStatus: { type: String, enum: ['paid', 'unpaid', 'partial'], default: 'paid' },
  totalPaid: { type: Number, default: 0 },
  totalUnpaid: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sale', SaleSchema);
