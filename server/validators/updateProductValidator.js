const Joi = require('joi');

const updateSchema = Joi.object({
  name: Joi.string().min(3).messages({ 'string.min': 'Product name should be at least 3 characters long' }),
  description: Joi.string().allow('', null),
  price: Joi.number().positive().min(1).messages({ 'number.base': 'Price must be a number' }),
  image: Joi.string().uri().allow('', null),
  categoryId: Joi.string().allow('', null),
  stock: Joi.number().integer().min(0).messages({ 'number.min': 'Stock cannot be negative' }),
  unit: Joi.string()
}).min(1).messages({ 'object.min': 'At least one field must be provided for update' });

module.exports = { updateSchema };
