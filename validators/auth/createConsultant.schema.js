const Joi = require("joi");

const createConsultantSchema = Joi.object({
  fullName: Joi.string().required(),
  email: Joi.string()
  .required()
  .email({
    minDomainSegments: 2,
    tlds: { allow: ["com", "ng", "net"] },
  }),  phone: Joi.string().required(),
  dateOfBirth: Joi.string().required(),
});

module.exports.createConsultantSchema = createConsultantSchema;
