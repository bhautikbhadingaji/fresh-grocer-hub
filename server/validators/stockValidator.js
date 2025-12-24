const Joi = require('joi');

const stockSchema = Joi.object({
  stock: Joi.number().integer().min(0),
  delta: Joi.number().integer()
}).or('stock', 'delta').messages({ 'object.missing': 'Provide either stock (absolute) or delta (increment)' });

module.exports = { stockSchema };
