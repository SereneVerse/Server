const AsyncHandler = require("express-async-handler");
const status = require("http-status");
const ForbiddenRequestError = require("../exceptions/forbidden.exception");
const UnauthorizedRequestError = require("../exceptions/badRequest.exception");
const { Post } = require("../models/post.model");
const { validateDbId } = require("../utils/mongoId.utils");

module.exports.createDailyPost = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;
    await validateDbId(userId);
    const { title, content, url } = req.body;

    const post = await Post.create({
      postedBy: userId,
      title,
      url,
      datePosted: new Date(Date.now()),
      content,
    });

    return res.status(status.CREATED).json({
      status: "success",
      statusCode: status.OK,
      data: {
        post,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports.createComment = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;
    const { id } = req.params;
    const { comment } = req.body;
    await validateDbId(userId, id);

    const post = await Post.findByIdAndUpdate(
      id,
      {
        $push: {
          comments: {
            comment,
            madeBy: userId,
          },
        },
      },
      { new: true }
    ).populate({
      path: "comments.madeBy",
      select: "userName fullName email displayImage isOnline",
    });

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.CREATED,
      data: {
        post,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports.deleteComment = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;
    const { id } = req.params;
    const { comment_id } = req.query;
    await validateDbId(userId, id, comment_id);

    const post = await Post.findByIdAndUpdate(
      id,
      {
        $pull: {
          comments: {
            _id: comment_id,
          },
        },
      },
      { new: true }
    ).populate({
      path: "comments.madeBy",
      select: "userName fullName email displayImage isOnline",
    });

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: {
        post,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports.deleteDailyPost = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;
    const { id } = req.params;
    await validateDbId(userId, id);

    await Post.findByIdAndDelete(id);

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
    });
  } catch (error) {
    next(error);
  }
});

module.exports.updateDailyPost = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;
    const { id } = req.params;
    await validateDbId(userId, id);
    const { title, content, url } = req.body;

    const post = await Post.findByIdAndUpdate(
      id,
      { content, title, url },
      { new: true }
    )
      .populate({
        path: "comments.madeBy",
        select: "userName fullName email displayImage isOnline",
      })
      .lean();

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: {
        post,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports.getAllDailyPost = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;
    await validateDbId(userId);

    const posts = await Post.find({});

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: {
        posts,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports.getTodayPost = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;
    await validateDbId(userId);

    const post = await Post.findOne().sort({ createdAt: -1 }).populate({
      path: "comments.madeBy",
      select: "userName fullName email displayImage isOnline",
    });

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: {
        post,
      },
    });
  } catch (error) {
    next(error);
  }
});
