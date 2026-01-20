const Sale = require('../models/Sale');
const Product = require('../models/Product');

exports.create = async (req, res) => {
  try {
    const { productId, quantity, unitPrice, customerName, paymentStatus } = req.body;

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

    const isPaid = paymentStatus === 'paid';
    const sale = await Sale.create({ 
      productId, 
      quantity, 
      unitPrice: price, 
      total,
      customerName: customerName || '',
      paymentStatus: isPaid ? 'paid' : 'unpaid',
      totalPaid: isPaid ? total : 0,
      totalUnpaid: isPaid ? 0 : total
    });

    res.status(201).json({ sale, product: updatedProduct });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { quantity, customerName, paymentStatus } = req.body;
    const saleId = req.params.id;

    const oldSale = await Sale.findById(saleId);
    if (!oldSale) return res.status(404).json({ message: 'Sale record not found' });

    const diff = quantity - oldSale.quantity;

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: oldSale.productId, stock: { $gte: diff } },
      { $inc: { stock: -diff } },
      { new: true }
    ).lean();

    if (!updatedProduct) {
      return res.status(400).json({ message: 'Insufficient stock to update sale' });
    }

    const unitPrice = oldSale.unitPrice;
    const total = unitPrice * quantity;

    const updatedSale = await Sale.findByIdAndUpdate(
      saleId,
      { 
        quantity, 
        total,
        customerName: customerName !== undefined ? customerName : oldSale.customerName,
        paymentStatus: paymentStatus || oldSale.paymentStatus
      },
      { new: true }
    ).populate('productId');

    res.json({ sale: updatedSale, product: updatedProduct });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const { amountPaid } = req.body;
    const saleId = req.params.id;

    const sale = await Sale.findById(saleId);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const newTotalPaid = (sale.totalPaid || 0) + amountPaid;
    const newTotalUnpaid = sale.total - newTotalPaid;

    let newPaymentStatus = 'unpaid';
    if (newTotalUnpaid <= 0) {
      newPaymentStatus = 'paid';
    } else if (newTotalPaid > 0) {
      newPaymentStatus = 'partial';
    }

    await Sale.findByIdAndUpdate(saleId, { 
      paymentStatus: newPaymentStatus,
      totalPaid: newTotalPaid,
      totalUnpaid: Math.max(0, newTotalUnpaid)
    });

    res.json({ message: 'Payment updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { date } = req.query;
    const filter = {};
    if (date) {
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

    const product = await Product.findByIdAndUpdate(sale.productId, { $inc: { stock: sale.quantity } }, { new: true }).lean();

    await Sale.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted', product });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
