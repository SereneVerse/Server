const Joi = require("joi");

const createUserSchema = Joi.object({
  fullName: Joi.string().required(),
  userName: Joi.string().required(),
  password: Joi.string().required(),
  role: Joi.number().required(),
  email: Joi.string()
    .required()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "ng", "net", "gov"] },
    }),
  dateOfBirth: Joi.date().required(),
  phone: Joi.string().required().min(11).max(14),
});

module.exports = {
  createUserSchema,
};
