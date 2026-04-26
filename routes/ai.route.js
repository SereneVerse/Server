const { Router } = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { isConsultant } = require("../middlewares/isAdmin.middleware");
const { detectCrisis } = require("../middlewares/crisis.middleware");
const {
  chat,
  sessionSummary,
  recommendResources,
  getCrisisFlags,
  resolveCrisisFlag,
  getThread,
} = require("../controllers/ai.controller");

const aiRouter = Router();

// AI support chatbot — streams response
aiRouter.route("/chat").post(authMiddleware, detectCrisis("ai_chat"), chat);

// AI chat thread history
aiRouter.route("/thread").get(authMiddleware, getThread);

// resource recommendations personalised to the user
aiRouter.route("/recommendations").get(authMiddleware, recommendResources);

// consultant/admin only — session briefing summary
aiRouter.route("/summary/:id").get(authMiddleware, isConsultant, sessionSummary);

// crisis flags — consultant/admin view and resolve
aiRouter.route("/crisis/:id").get(authMiddleware, isConsultant, getCrisisFlags);
aiRouter.route("/crisis/resolve/:id").patch(authMiddleware, isConsultant, resolveCrisisFlag);

module.exports = { aiRouter };
