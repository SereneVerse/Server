const Anthropic = require("@anthropic-ai/sdk");
const { anthropicApiKey } = require("../config/constants.config");
const { CrisisFlag } = require("../models/CrisisFlag.model");
const { User } = require("../models/user.model");
const { sendMail } = require("../utils/mailer.utils");

const client = new Anthropic({ apiKey: anthropicApiKey });

const SYSTEM_PROMPT = `You are a safety classifier for a mental health platform.
Classify the following message as exactly one of: safe, concerning, crisis.
- safe: normal conversation, no distress signals
- concerning: signs of emotional difficulty, sadness, anxiety, hopelessness — worth monitoring
- crisis: explicit or implicit self-harm, suicidal ideation, immediate danger
Respond with a single JSON object: {"severity":"safe"|"concerning"|"crisis"}
Do not explain. Return only JSON.`;

/**
 * Runs crisis detection on a message after the main route handler responds.
 * Non-blocking — errors are logged but do not affect the response.
 */
const detectCrisis = (source = "ai_chat") =>
  async (req, _res, next) => {
    next(); // let the main handler respond first

    const message = req.crisisMessage;
    const userId = req.userId;
    if (!message || !userId) return;

    try {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 64,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: message }],
      });

      const text = response.content[0]?.text?.trim() || "{}";
      const { severity } = JSON.parse(text);

      if (severity === "concerning" || severity === "crisis") {
        await CrisisFlag.create({ userId, messageContent: message, severity, source });

        if (severity === "crisis") {
          // notify the user's first assigned consultant
          const user = await User.findById(userId).populate("expertsContacted");
          const consultant = user?.expertsContacted?.[0];
          if (consultant?.email) {
            await sendMail(
              consultant.email,
              "⚠️ Crisis Alert — SereneVerse",
              "crisisAlert",
              { patientName: user.fullName, message },
              consultant.fullName
            );
          }
        }
      }
    } catch (_err) {
      // crisis detection must never break the main flow
    }
  };

module.exports = { detectCrisis };
