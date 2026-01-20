const mongoose = require('mongoose');
const Sale = require('./models/Sale');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fresh-grocer')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function migrateSales() {
  try {
    console.log('Starting migration...');
    
    // Find all sales that don't have totalPaid or totalUnpaid
    const sales = await Sale.find({
      $or: [
        { totalPaid: { $exists: false } },
        { totalUnpaid: { $exists: false } }
      ]
    });

    console.log(`Found ${sales.length} sales to migrate`);

    for (const sale of sales) {
      let totalPaid = 0;
      let totalUnpaid = 0;

      if (sale.paymentStatus === 'paid') {
        totalPaid = sale.total;
        totalUnpaid = 0;
      } else if (sale.paymentStatus === 'unpaid') {
        totalPaid = 0;
        totalUnpaid = sale.total;
      } else {
        // partial or unknown - set as unpaid
        totalPaid = 0;
        totalUnpaid = sale.total;
      }

      await Sale.findByIdAndUpdate(sale._id, {
        totalPaid,
        totalUnpaid
      });

      console.log(`Updated sale ${sale._id}: totalPaid=${totalPaid}, totalUnpaid=${totalUnpaid}`);
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateSales();
