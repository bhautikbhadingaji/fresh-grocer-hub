const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  image: { type: String },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  stock: { type: Number, default: 0 },
  unit: { type: String, default: 'kg' },
  expiryDate: { type: Date },
  batchNo: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);