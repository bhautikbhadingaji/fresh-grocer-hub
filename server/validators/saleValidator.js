const Joi = require('joi');

const createSaleSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  unitPrice: Joi.number().positive().optional()
});

module.exports = { createSaleSchema };
