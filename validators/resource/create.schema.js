const Joi = require("joi");

module.exports.createResourceSchema = Joi.object({
  articles : Joi.array().required(),
  videos : Joi.array().required(),
});
