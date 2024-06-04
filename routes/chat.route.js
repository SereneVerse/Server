const { Router } = require("express");
const {
  createChat,
  deleteChat,
  loadOldChats,
} = require("../controllers/chat.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const validator = require("../middlewares/validator.middleware");
const { createChatSchema } = require("../validators/chat/create.validator");

const chatRouter = Router();

chatRouter
  .route("/create")
  .post(validator(createChatSchema), authMiddleware, createChat);

chatRouter.route("/:senderId/:receiverId").get(authMiddleware, loadOldChats);

chatRouter.route("/delete/:id").delete(authMiddleware, deleteChat);

module.exports = chatRouter;
