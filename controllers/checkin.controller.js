const AsyncHandler = require("express-async-handler");
const Anthropic = require("@anthropic-ai/sdk");
const status = require("http-status");
const { anthropicApiKey } = require("../config/constants.config");
const { Checkin } = require("../models/Checkin.model");
const { Streak } = require("../models/streaks.model");
const UnauthorizedRequestError = require("../exceptions/badRequest.exception");
const ForbiddenRequestError = require("../exceptions/forbidden.exception");
const { User } = require("../models/user.model");

const client = new Anthropic({ apiKey: anthropicApiKey });

// 7.3 — Submit a mood check-in; AI extracts score + themes
const createCheckin = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;
    const { text } = req.body;

    if (!text) throw new UnauthorizedRequestError("text is required");

    // attach for crisis middleware
    req.crisisMessage = text;

    const prompt = `Extract a mood score 1-10 and up to 3 themes from this text.
Return a JSON object only — no explanation:
{"score": 7, "themes": ["anxiety", "sleep issues", "work stress"]}
Text: "${text}"`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 128,
      messages: [{ role: "user", content: prompt }],
    });

    let moodScore = null;
    let themes = [];

    try {
      const parsed = JSON.parse(response.content[0]?.text?.trim() || "{}");
      moodScore = parsed.score ?? null;
      themes = parsed.themes ?? [];
    } catch (_) {
      // fallback: save raw text without AI parsing
    }

    const checkin = await Checkin.create({ userId, rawText: text, moodScore, themes });

    return res.status(status.CREATED).json({
      status: "success",
      statusCode: status.CREATED,
      data: { checkin },
    });
  } catch (error) {
    next(error);
  }
});

// own check-in history (paginated)
const myCheckins = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [checkins, total] = await Promise.all([
      Checkin.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Checkin.countDocuments({ userId }),
    ]);

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: {
        checkins,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
});

// consultant/admin view of a patient's check-ins
const patientCheckins = AsyncHandler(async (req, res, next) => {
  try {
    const { userId: requesterId } = req;
    const { id: patientId } = req.params;

    const requester = await User.findById(requesterId);
    if (!requester || requester.role > 2) {
      throw new ForbiddenRequestError("Only consultants and admins can view patient check-ins");
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [checkins, total] = await Promise.all([
      Checkin.find({ userId: patientId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Checkin.countDocuments({ userId: patientId }),
    ]);

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: {
        checkins,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
});

// 7.4 — Get active streak with AI motivation message (cached per day)
const getStreakWithMotivation = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;
    const { id } = req.params;

    const streak = await Streak.findById(id);
    if (!streak) throw new ForbiddenRequestError("Streak not found");

    const today = new Date().toDateString();
    const cachedToday =
      streak.motivationDate &&
      new Date(streak.motivationDate).toDateString() === today;

    let motivationMessage = streak.motivationMessage || null;

    if (!cachedToday && streak.status === "active") {
      try {
        const response = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 100,
          messages: [
            {
              role: "user",
              content: `Write a warm 2-sentence motivational message for someone on day ${streak.currentStreak} of their "${streak.name}" streak. Be encouraging and specific to the streak name.`,
            },
          ],
        });
        motivationMessage = response.content[0]?.text?.trim() || null;
        streak.motivationMessage = motivationMessage;
        streak.motivationDate = new Date();
        await streak.save();
      } catch (_) {
        // motivation is non-critical — don't fail the request
      }
    }

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: { streak, motivationMessage },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = { createCheckin, myCheckins, patientCheckins, getStreakWithMotivation };
