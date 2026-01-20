const Sale = require('../models/Sale');
const Payment = require('../models/Payment');

exports.getAll = async (req, res) => {
  try {
    const { search } = req.query;

    const customers = await Sale.aggregate([
      { $match: { customerName: { $ne: '', $exists: true } } },
      {
        $group: {
          _id: '$customerName',
          totalPurchases: { $sum: '$total' },
          totalPaid: { $sum: { $ifNull: ['$totalPaid', 0] } },
          totalUnpaid: { $sum: { $ifNull: ['$totalUnpaid', '$total'] } },
          salesCount: { $sum: 1 },
          lastPurchaseDate: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          totalPurchases: 1,
          totalPaid: 1,
          totalUnpaid: 1,
          salesCount: 1,
          lastPurchaseDate: 1
        }
      },
      { $sort: { lastPurchaseDate: -1 } }
    ]);

    const filtered = search
      ? customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
      : customers;

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { name } = req.params;
   
    const sales = await Sale.find({ customerName: name })
      .populate('productId')
      .sort({ createdAt: -1 });

    const payments = await Payment.find({ customerId: name })
      .sort({ paymentDate: -1 });

    const totalPurchases = sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalPaid = sales.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
    const totalUnpaid = sales.reduce((sum, s) => sum + (s.totalUnpaid || s.total || 0), 0);

    res.json({
      customer: { name, totalPurchases, totalPaid, totalUnpaid },
      sales,
      payments,
      summary: {
        totalPurchases,
        totalPaid,
        totalUnpaid,
        salesCount: sales.length,
        lastPurchaseDate: sales[0]?.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.recordPayment = async (req, res) => {
  try {
    const { saleId, amountPaid, paymentMethod } = req.body;
   
    const sale = await Sale.findById(saleId);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const totalBill = Number(sale.total || 0);
    const currentPaid = Number(sale.totalPaid || 0);
    const amountToPay = Number(amountPaid);
    const remainingToPay = totalBill - currentPaid;

    console.log('Payment Debug:', {
      totalBill,
      currentPaid,
      amountToPay,
      remainingToPay
    });

    if (isNaN(amountToPay) || amountToPay <= 0 || amountToPay > (remainingToPay + 0.01)) {
      return res.status(400).json({
        message: `Invalid amount. Max: ₹${remainingToPay.toFixed(2)}`
      });
    }

    await Payment.create({
      saleId,
      customerId: sale.customerName,
      amountPaid: amountToPay,
      paymentMethod: paymentMethod || 'cash'
    });

    const newTotalPaid = currentPaid + amountToPay;
    const newTotalUnpaid = Math.max(0, totalBill - newTotalPaid);

    let newStatus = 'unpaid';
    if (newTotalUnpaid <= 0.01) {
      newStatus = 'paid';
    } else if (newTotalPaid > 0) {
      newStatus = 'partial';
    }

    console.log('Updating Sale:', {
      newTotalPaid,
      newTotalUnpaid,
      newStatus
    });

    const updatedSale = await Sale.findByIdAndUpdate(saleId, {
      paymentStatus: newStatus,
      totalPaid: newTotalPaid,
      totalUnpaid: newTotalUnpaid
    }, { new: true });

    console.log('Updated Sale:', updatedSale);

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      sale: updatedSale
    });
  } catch (err) {
    console.error('Payment Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const summary = await Sale.aggregate([
      { $match: { customerName: { $ne: '', $exists: true } } },
      {
        $group: {
          _id: '$customerName',
          totalPurchases: { $sum: '$total' },
          totalPaid: { $sum: { $ifNull: ['$totalPaid', 0] } },
          totalUnpaid: { $sum: { $ifNull: ['$totalUnpaid', '$total'] } }
        }
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          totalRevenue: { $sum: '$totalPurchases' },
          totalPaid: { $sum: '$totalPaid' },
          totalUnpaid: { $sum: '$totalUnpaid' },
          customersWithUnpaid: {
            $sum: { $cond: [{ $gt: ['$totalUnpaid', 0] }, 1, 0] }
          }
        }
      }
    ]);

    res.json(summary[0] || {
      totalCustomers: 0,
      totalRevenue: 0,
      totalPaid: 0,
      totalUnpaid: 0,
      customersWithUnpaid: 0
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
