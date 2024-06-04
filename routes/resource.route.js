const { Router } = require("express");

const authMiddleware = require("../middlewares/auth.middleware");
const { isAdmin } = require("../middlewares/isAdmin.middleware");
const {
  addNewResource,
  getVideoResources,
  getArticleResources,
  deleteResource,
  updateResource,
} = require("../controllers/resource.controller");
const validator = require("../middlewares/validator.middleware");
const {
  createResourceSchema,
} = require("../validators/resource/create.schema");
const {
  updateResourceSchema,
} = require("../validators/resource/update.schema");

const resourceRouter = Router();

resourceRouter
  .route("/create")
  .post(
    validator(createResourceSchema),
    authMiddleware,
    isAdmin,
    addNewResource
  );

resourceRouter.route("/video").get(authMiddleware, getVideoResources);

resourceRouter.route("/article").get(authMiddleware, getArticleResources);

resourceRouter
  .route("/delete/:id")
  .delete(authMiddleware, isAdmin, deleteResource);

resourceRouter
  .route("/update/:id")
  .patch(
    validator(updateResourceSchema),
    authMiddleware,
    isAdmin,
    updateResource
  );

module.exports = {
  resourceRouter,
};
