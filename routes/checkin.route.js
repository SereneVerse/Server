const { Router } = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { isConsultant } = require("../middlewares/isAdmin.middleware");
const { detectCrisis } = require("../middlewares/crisis.middleware");
const {
  createCheckin,
  myCheckins,
  patientCheckins,
  getStreakWithMotivation,
} = require("../controllers/checkin.controller");

const checkinRouter = Router();

// submit a mood check-in
checkinRouter.route("/").post(authMiddleware, detectCrisis("ai_chat"), createCheckin);

// own check-in history (paginated)
checkinRouter.route("/me").get(authMiddleware, myCheckins);

// get a streak with AI motivation message
checkinRouter.route("/streak/:id/motivation").get(authMiddleware, getStreakWithMotivation);

// consultant/admin view of patient check-ins
checkinRouter.route("/patient/:id").get(authMiddleware, isConsultant, patientCheckins);

module.exports = { checkinRouter };
