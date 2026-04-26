const { Router } = require("express");
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  confirmOtp,
  refresh,
  logOut,
  handleGoogleAuth,
  verifyConsultant,
} = require("../controllers/auth.controller");
const validator = require("../middlewares/validator.middleware");
const { loginSchema } = require("../validators/auth/login.schema");
const { createUserSchema } = require("../validators/auth/signup.schema");
const { checkEmailSchema } = require("../validators/auth/checkForEmail.schema");
const { checkPassSchema } = require("../validators/auth/checkForPass.schema");
const { otpSchema } = require("../validators/auth/otp.schema");
const authMiddleware = require("../middlewares/auth.middleware");
const passport = require("../middlewares/auth.google.middleware");
const { authLimiter, otpLimiter } = require("../middlewares/rateLimiter");

const authRouter = Router();

authRouter.route("/register").post(authLimiter, validator(createUserSchema), register);

authRouter.route("/login").post(authLimiter, validator(loginSchema), login);

authRouter
  .route("/google")
  .get(passport.authenticate("google", { scope: ["email", "profile"] }));

authRouter
  .route("/google/callback")
  .get(passport.authenticate("google", { session: false }), handleGoogleAuth);

authRouter.route("/verify-expert/:token").get(verifyConsultant);

authRouter
  .route("/password/forgot")
  .post(authLimiter, validator(checkEmailSchema), forgotPassword);

authRouter.route("/refresh").post(refresh);

authRouter
  .route("/password/reset")
  .patch(validator(checkPassSchema), authMiddleware, resetPassword);

authRouter.route("/confirm-otp").post(otpLimiter, validator(otpSchema), confirmOtp);

authRouter.route("/sign-out").delete(authMiddleware, logOut);

module.exports = authRouter;
