const AsyncHandler = require("express-async-handler");
const status = require("http-status");
const ForbiddenRequestError = require("../exceptions/forbidden.exception");
const UnauthorizedRequestError = require("../exceptions/badRequest.exception");
const { validateDbId } = require("../utils/mongoId.utils");
const { Resource } = require("../models/resources.model");

module.exports.addNewResource = AsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req;
    await validateDbId(userId);
    const { articles, videos } = req.body;

    const typedArticles = articles.map((article) => ({
      ...article,
      type: "article",
      postedBy: userId,
      datePosted: new Date(Date.now()),
    }));

    const typedVideos = videos.map((video) => ({
      ...video,
      type: "video",
      postedBy: userId,
      datePosted: new Date(Date.now()),
    }));

    const newResources = [...typedArticles, ...typedVideos];

    const resources = await Resource.create(newResources);

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: {
        resources,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports.getVideoResources = AsyncHandler(async (req, res, next) => {
  try {
    const videoResource = await Resource.find({ type: "video" });

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: {
        videoResource,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports.getArticleResources = AsyncHandler(async (req, res, next) => {
  try {
    const articleResource = await Resource.find({ type: "article" });

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: {
        articleResource,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports.deleteResource = AsyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    await validateDbId(id);

    await Resource.findByIdAndDelete(id);
    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
    });
  } catch (error) {
    next(error);
  }
});

module.exports.updateResource = AsyncHandler(async (req, res, next) => {
  try {
    const { author, description, link } = req.body;
    const { id } = req.params;
    await validateDbId(id);

    const resource = await Resource.findByIdAndUpdate(
      id,
      { author, description, link },
      { new: true }
    );
    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: {
        resource,
      },
    });
  } catch (error) {
    next(error);
  }
});
