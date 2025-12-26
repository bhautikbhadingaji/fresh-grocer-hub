const Joi = require('joi');

const createSaleSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().min(0.01).required(),
  unitPrice: Joi.number().positive().optional()
});

// Aa badlav karo: .unknown(true) add karyu che
const updateSaleSchema = Joi.object({
  quantity: Joi.number().min(0.01).required()
}).unknown(true); 

module.exports = { createSaleSchema, updateSaleSchema };