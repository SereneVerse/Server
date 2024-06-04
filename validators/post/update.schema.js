const Joi = require("joi");

module.exports.updatePostSchema = Joi.object({
  title: Joi.string(),
  content: Joi.string(),
  url: Joi.string(),
});
