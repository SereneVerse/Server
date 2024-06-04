const AsyncHandler = require("express-async-handler");
const { Chat } = require("../models/chat.model");
const { validateDbId } = require("../utils/mongoId.utils");
const status = require("http-status");

const createChat = AsyncHandler(async (req, res, next) => {
  try {
    const { senderId, receiverId, message, senderProfile, sentAt, date } =
      req.body;
    await validateDbId(senderId, receiverId);

    const chat = await Chat.create({
      senderId,
      receiverId,
      message,
      senderProfile,
      sentAt,
      date,
    });

    const myChat = await Chat.findById(chat._id).populate({
      path: "senderId",
      select: "userName fullName displayImage isOnline email phone role",
    });
    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: {
        chat: myChat,
      },
    });
  } catch (error) {
    next(error);
  }
});

const deleteChat = AsyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    await validateDbId(id);

    const chat = await Chat.findByIdAndUpdate(
      id,
      {
        message: "This message was deleted",
        status: "deleted",
      },
      { new: true }
    );

    return res.status(status.OK).json({
      status: "success",
      statusCode: status.OK,
      data: {
        chat,
      },
    });
  } catch (error) {
    next(error);
  }
});

const loadOldChats = AsyncHandler(async (req, res, next) => {
 try {
  const { senderId, receiverId } = req.params;

  const chats = await Chat.find({
    $or: [
      { senderId, receiverId },
      { senderId: receiverId, receiverId: senderId },
    ],
  }).populate({
    path: "senderId",
    select: "fullName displayImage isOnline email phone role",
  });
  
  return res.status(status.OK).json({
    status: "success",
    statusCode: status.OK,
    data: {
      chats
    },
  });
 } catch (error) {
    next(error)
 }
});

module.exports = {
  createChat,
  deleteChat,
  loadOldChats
};
