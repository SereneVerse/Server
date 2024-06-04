const Joi = require("joi");

module.exports.updateResourceSchema = Joi.object({
  author: Joi.string(),
  description: Joi.string(),
  link: Joi.string(),
});
