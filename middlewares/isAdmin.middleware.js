const AsyncHandler = require("express-async-handler");
const { User } = require("../models/user.model");
const ForbiddenRequestError = require("../exceptions/forbidden.exception");
const UnauthorizedRequestError = require("../exceptions/badRequest.exception");

const isAdmin = AsyncHandler(async (req, res, next) => {
  try {
    const id = req.userId;
    const user = await User.findById(id);
    if (user) {
      if (user.isAdmin && user.role === 1) {
        next();
      } else {
        throw new UnauthorizedRequestError(
          "Authenticated user not authorized to access this route"
        );
      }
    } else {
      throw new ForbiddenRequestError("User not found");
    }
  } catch (error) {
    next(error);
  }
});

const isConsultant = AsyncHandler(async (req, res, next) => {
  try {
    const id = req.userId;
    const user = await User.findById(id);
    if (user) {
      if (user.role <= 2) {
        next();
      } else {
        throw new UnauthorizedRequestError(
          "Authenticated user not authorized to access this route"
        );
      }
    } else {
      throw new ForbiddenRequestError("User not found");
    }
  } catch (error) {
    next(error);
  }
});

module.exports = { isAdmin, isConsultant };
