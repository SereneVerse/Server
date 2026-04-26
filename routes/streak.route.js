const { Router } = require("express");

const authMiddleware = require("../middlewares/auth.middleware");
const {
  startNewStreak,
  endCurrentStreak,
  restartExistingStreak,
  getUserStreaks,
  getActiveStreak,
  myStreak,
  checkIn,
} = require("../controllers/streak.controller");
const validator = require("../middlewares/validator.middleware");
const { startStreakSchema } = require("../validators/streak/start.schema");

const streakRouter = Router();

streakRouter.route("/start").post(validator(startStreakSchema), authMiddleware, startNewStreak);

streakRouter.route("/yay/:id").get(authMiddleware, myStreak);

streakRouter.route("/checkin/:id").post(authMiddleware, checkIn);

streakRouter.route("/end/:id").get(authMiddleware, endCurrentStreak);

streakRouter.route("/restart/:id").get(authMiddleware, restartExistingStreak);

streakRouter.route("/").get(authMiddleware, getUserStreaks);

streakRouter.route("/active").get(authMiddleware, getActiveStreak);

module.exports = {
  streakRouter,
};
