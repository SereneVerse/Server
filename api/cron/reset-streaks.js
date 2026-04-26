const { ConnectDb } = require("../../config/db.config");
const { Streak } = require("../../models/streaks.model");
const { cronSecret } = require("../../config/constants.config");

/**
 * Vercel Cron job — runs daily at 08:00 UTC.
 * Resets any streak not updated in the last 48 hours.
 * Protected by CRON_SECRET so it cannot be triggered by anyone else.
 */
module.exports = async (req, res) => {
  const authHeader = req.headers.authorization || "";
  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await ConnectDb();

    const result = await Streak.aggregate([
      {
        $match: {
          lastUpdated: { $lt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
          status: "active",
        },
      },
      {
        $addFields: {
          pastStreak: "$currentStreak",
          currentStreak: 0,
          status: "inactive",
        },
      },
      {
        $merge: {
          into: "streaks",
          on: "_id",
          whenMatched: "merge",
          whenNotMatched: "discard",
        },
      },
    ]);

    return res.status(200).json({ success: true, message: "Streak reset complete" });
  } catch (err) {
    return res.status(500).json({ error: "Streak reset failed", detail: err.message });
  }
};
