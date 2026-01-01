const Joi = require('joi');

const createSaleSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().min(0.01).required(),
  unitPrice: Joi.number().positive().optional(),
  customerName: Joi.string().allow('').optional(),
  paymentStatus: Joi.string().valid('paid', 'unpaid').optional()
}).custom((value, helpers) => {
  // If paymentStatus is 'unpaid', customerName is required and cannot be empty
  if (value.paymentStatus === 'unpaid' && (!value.customerName || value.customerName.trim() === '')) {
    return helpers.error('any.custom', { 
      message: 'Customer name is required when payment status is unpaid' 
    });
  }
  return value;
});

const updateSaleSchema = Joi.object({
  quantity: Joi.number().min(0.01).required(),
  customerName: Joi.string().allow('').optional(),
  paymentStatus: Joi.string().valid('paid', 'unpaid').optional()
}).unknown(true).custom((value, helpers) => {
  // If paymentStatus is 'unpaid', customerName is required and cannot be empty
  if (value.paymentStatus === 'unpaid' && (!value.customerName || value.customerName.trim() === '')) {
    return helpers.error('any.custom', { 
      message: 'Customer name is required when payment status is unpaid' 
    });
  }
  return value;
});

module.exports = { createSaleSchema, updateSaleSchema };