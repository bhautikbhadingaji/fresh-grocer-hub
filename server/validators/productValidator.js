const Joi = require('joi');

const createSchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    'string.empty': 'Product name is required',
    'string.min': 'Product name should be at least 3 characters long',
    'any.required': 'Product name is a required field'
  }),
  description: Joi.string().allow('', null),
  price: Joi.number().positive().min(1).required().messages({
    'number.base': 'Price must be a number',
    'number.positive': 'Price must be a positive value',
    'number.min': 'Price must be at least 1',
    'any.required': 'Price is required'
  }),
  image: Joi.string().uri().allow('', null).messages({
    'string.uri': 'Please provide a valid image URL'
  }),
  categoryId: Joi.string().allow('', null),
  stock: Joi.number().integer().min(0).default(0).messages({
    'number.min': 'Stock cannot be negative',
    'number.integer': 'Stock must be a whole number'
  }),
  unit: Joi.string().default('kg'),
  
  batchNo: Joi.string().required().messages({
    'string.empty': 'Batch number is required',
    'any.required': 'Batch number is required'
  }),
  expiryDate: Joi.date().required().messages({
    'date.base': 'Please provide a valid expiry date',
    'any.required': 'Expiry date is required'
  })
});

module.exports = { createSchema };