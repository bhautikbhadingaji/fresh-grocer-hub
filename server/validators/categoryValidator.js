const Joi = require('joi');

const createSchema = Joi.object({
  name: Joi.string().required(),
  icon: Joi.string().allow('', null)
});

module.exports = { createSchema };
