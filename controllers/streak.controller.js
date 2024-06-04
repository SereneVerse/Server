const AsyncHandler = require("express-async-handler");
const status = require("http-status");
const ForbiddenRequestError = require("../exceptions/forbidden.exception");
const UnauthorizedRequestError = require("../exceptions/badRequest.exception");
const { validateDbId } = require("../utils/mongoId.utils");
const { Streak } = require("../models/streaks.model");
const { User } = require("../models/user.model");

module.exports.startNewStreak = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;
    const { name } = req.body;
    await validateDbId(userId);

    const streak = await Streak.create({
      userId,
      name,
      currentStreak : 1,
      currentStreakStarted: new Date(Date.now()),
    });

    await User.findByIdAndUpdate(userId, {
      $push: { streaks: streak._id },
    });

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: {
        streak,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports.myStreak = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;
    const { id } = req.params;
    await validateDbId(userId, id);

    const streak = await Streak.findById(id);

    if (
      new Date(streak.lastUpdated).getTime() + 24 * 60 * 60 * 1000 <=
      Date.now()
    ) {
      streak.currentStreak = streak.currentStreak + 1;
      streak.lastUpdated = Date.now();
      await streak.save();
    }
    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: {
        streak,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports.endCurrentStreak = AsyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    await validateDbId(id);

    const streak = await Streak.findById(id);
    streak.status = "inactive";
    streak.pastStreak = streak.currentStreak;
    streak.currentStreak = 0;
    await streak.save();

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: {
        streak,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports.restartExistingStreak = AsyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    await validateDbId(id);

    const streak = await Streak.findByIdAndUpdate(
      id,
      { status: "active", currentStreak : 1},
      { new: true }
    );

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
    });
  } catch (error) {
    next(error);
  }
});

module.exports.getUserStreaks = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;
    await validateDbId(userId);

    const streaks = await Streak.find({ userId });

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: {
        streaks,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports.getActiveStreak = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;
    await validateDbId(userId);

    const activeStreaks = await Streak.find({ userId, status: "active" });

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: {
        activeStreaks,
      },
    });
  } catch (error) {
    next(error);
  }
});
