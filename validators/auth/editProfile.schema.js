const Joi = require("joi");

module.exports.editProfileSchema = Joi.object({
  fullName: Joi.string(),
  userName: Joi.string(),
  dateOfBirth: Joi.date(),
  phone: Joi.string().min(11).max(14),

});
