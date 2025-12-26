const Sale = require('../models/Sale');
const Product = require('../models/Product');

// Create sale and decrement product stock atomically using conditional update
exports.create = async (req, res) => {
  try {
    const { productId, quantity, unitPrice } = req.body;

    // Attempt to decrement stock only if enough stock exists
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true }
    ).lean();

    if (!updatedProduct) {
      return res.status(400).json({ message: 'Insufficient stock or product not found' });
    }

    const price = unitPrice || updatedProduct.price || 0;
    const total = price * quantity;

    const sale = await Sale.create({ productId, quantity, unitPrice: price, total });

    res.status(201).json({ sale, product: updatedProduct });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { date } = req.query;
    const filter = {};
    if (date) {
      // Expecting YYYY-MM-DD
      const start = new Date(date);
      start.setHours(0,0,0,0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    }
    const list = await Sale.find(filter).populate('productId').sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.summary = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const end = new Date();
    end.setHours(23,59,59,999);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0,0,0,0);

    const list = await Sale.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalRevenue: { $sum: "$total" },
          totalQty: { $sum: "$quantity" },
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).lean();
    if (!sale) return res.status(404).json({ message: 'Sale not found' });

    // Restock product by sale quantity
    const product = await Product.findByIdAndUpdate(sale.productId, { $inc: { stock: sale.quantity } }, { new: true }).lean();

    await Sale.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted', product });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
