const AsyncHandler = require("express-async-handler");
const Anthropic = require("@anthropic-ai/sdk");
const status = require("http-status");
const { anthropicApiKey } = require("../config/constants.config");
const { AIThread } = require("../models/AIThread.model");
const { Checkin } = require("../models/Checkin.model");
const { CrisisFlag } = require("../models/CrisisFlag.model");
const { Streak } = require("../models/streaks.model");
const { Chat } = require("../models/chat.model");
const { User } = require("../models/user.model");
const ForbiddenRequestError = require("../exceptions/forbidden.exception");
const UnauthorizedRequestError = require("../exceptions/badRequest.exception");

const client = new Anthropic({ apiKey: anthropicApiKey });

const AI_SYSTEM_PROMPT = `You are Serenity, a compassionate AI companion on SereneVerse — a mental health and wellness platform.
Your role is to provide emotional support, active listening, and gentle guidance between professional consultant sessions.
You are NOT a therapist and cannot provide clinical advice, diagnoses, or treatment plans.
Always encourage users to speak with their assigned consultant for serious concerns.
Be warm, empathetic, non-judgmental, and concise. Keep responses under 200 words unless the user needs more.
If a user expresses thoughts of self-harm or immediate crisis, respond with care and urge them to contact their consultant or a crisis line immediately.`;

// 7.1 — AI Support Chatbot (streaming)
const chat = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;
    const { message } = req.body;

    if (!message) throw new UnauthorizedRequestError("Message is required");

    // attach message for crisis middleware
    req.crisisMessage = message;

    // find or create thread
    let thread = await AIThread.findOne({ userId });
    if (!thread) thread = await AIThread.create({ userId, messages: [] });

    // build conversation history (last 20 messages for context window)
    const history = thread.messages.slice(-20).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    history.push({ role: "user", content: message });

    // stream the response
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: AI_SYSTEM_PROMPT,
      messages: history,
    });

    stream.on("text", (text) => {
      fullResponse += text;
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });

    stream.on("finalMessage", async () => {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();

      // persist both turns to thread
      thread.messages.push({ role: "user", content: message });
      thread.messages.push({ role: "assistant", content: fullResponse });
      await thread.save();
    });

    stream.on("error", (err) => {
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      res.end();
    });
  } catch (error) {
    next(error);
  }
});

// 7.5 — Consultant Session Summarizer
const sessionSummary = AsyncHandler(async (req, res, next) => {
  try {
    const { userId: consultantId } = req;
    const { id: patientId } = req.params;

    // verify requester is a consultant or admin
    const requester = await User.findById(consultantId);
    if (!requester || requester.role > 2) {
      throw new ForbiddenRequestError("Only consultants and admins can access summaries");
    }

    const patient = await User.findById(patientId);
    if (!patient) throw new ForbiddenRequestError("Patient not found");

    // check 1-hour cache on the patient document
    const now = Date.now();
    if (
      patient.aiSummary &&
      patient.aiSummaryGeneratedAt &&
      now - new Date(patient.aiSummaryGeneratedAt).getTime() < 60 * 60 * 1000
    ) {
      return res.status(status.OK).json({
        status: "success",
        statusCode: status.OK,
        data: { summary: patient.aiSummary, cached: true },
      });
    }

    // fetch last 30 chats + last 7 check-ins
    const [recentChats, recentCheckins] = await Promise.all([
      Chat.find({
        $or: [{ senderId: patientId }, { receiverId: patientId }],
      })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      Checkin.find({ userId: patientId }).sort({ createdAt: -1 }).limit(7).lean(),
    ]);

    const chatSummary = recentChats
      .map((c) => `[${c.sentAt}] ${c.message}`)
      .join("\n");
    const checkinSummary = recentCheckins
      .map((c) => `Score: ${c.moodScore}/10, Themes: ${c.themes?.join(", ")} — "${c.rawText}"`)
      .join("\n");

    const prompt = `You are a clinical support tool for a mental health consultant.
Based on the patient's recent activity, produce a 3-bullet briefing:
1. Recent mood trend
2. Key recurring themes
3. Suggested focus for the next session

Recent chats:
${chatSummary || "No recent chats"}

Recent check-ins:
${checkinSummary || "No recent check-ins"}

Return the 3 bullets only. Be concise and clinically useful.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const summary = response.content[0]?.text?.trim() || "No summary available";

    // cache on patient document (requires aiSummary field — added via update)
    await User.findByIdAndUpdate(patientId, {
      aiSummary: summary,
      aiSummaryGeneratedAt: new Date(),
    });

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: { summary, cached: false },
    });
  } catch (error) {
    next(error);
  }
});

// 7.6 — Personalized Resource Recommendations
const recommendResources = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;

    const [recentCheckins, activeStreaks, allResources] = await Promise.all([
      Checkin.find({ userId }).sort({ createdAt: -1 }).limit(3).lean(),
      Streak.find({ userId, status: "active" }).lean(),
      // dynamic import to avoid circular deps — Resource model
      require("../models/resources.model").Resource.find({}).select("author description type link").lean(),
    ]);

    if (!allResources.length) {
      return res.status(status.OK).json({
        status: "success",
        statusCode: status.OK,
        data: { recommendations: [] },
      });
    }

    const moodContext = recentCheckins.length
      ? `Recent mood scores: ${recentCheckins.map((c) => c.moodScore).join(", ")}. Themes: ${[...new Set(recentCheckins.flatMap((c) => c.themes))].join(", ")}.`
      : "No recent check-in data.";

    const streakContext = activeStreaks.length
      ? `Active streaks: ${activeStreaks.map((s) => s.name).join(", ")}.`
      : "No active streaks.";

    const resourceList = allResources
      .map((r, i) => `${i + 1}. [${r.type}] by ${r.author}: ${r.description}`)
      .join("\n");

    const prompt = `A mental health app user has the following context:
${moodContext}
${streakContext}

Available resources:
${resourceList}

Pick the 3 most relevant resources for this user. Return a JSON array of their 1-based indices only:
{"picks": [2, 5, 8]}`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 64,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0]?.text?.trim() || "{}";
    const { picks } = JSON.parse(text);

    const recommendations = (picks || [])
      .filter((i) => i >= 1 && i <= allResources.length)
      .map((i) => allResources[i - 1]);

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: { recommendations },
    });
  } catch (error) {
    next(error);
  }
});

// 7.3 — Get crisis flags for a patient (consultant/admin only)
const getCrisisFlags = AsyncHandler(async (req, res, next) => {
  try {
    const { userId: requesterId } = req;
    const { id: patientId } = req.params;

    const requester = await User.findById(requesterId);
    if (!requester || requester.role > 2) {
      throw new ForbiddenRequestError("Only consultants and admins can view crisis flags");
    }

    const flags = await CrisisFlag.find({ userId: patientId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: { flags },
    });
  } catch (error) {
    next(error);
  }
});

// resolve a crisis flag
const resolveCrisisFlag = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;
    const { id } = req.params;

    const flag = await CrisisFlag.findByIdAndUpdate(
      id,
      { resolvedAt: new Date(), resolvedBy: userId },
      { new: true }
    );

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: { flag },
    });
  } catch (error) {
    next(error);
  }
});

// load AI thread history
const getThread = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;
    const thread = await AIThread.findOne({ userId });

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: { messages: thread?.messages || [] },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  chat,
  sessionSummary,
  recommendResources,
  getCrisisFlags,
  resolveCrisisFlag,
  getThread,
};
