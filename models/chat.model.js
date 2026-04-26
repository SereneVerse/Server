const { Schema, model, Types } = require("mongoose");

// Declare the Schema of the Mongo model
const chatSchema = new Schema(
  {
    senderId: {
      type: Types.ObjectId,
      ref: "User",
      index: true,
    },
    receiverId: {
      type: Types.ObjectId,
      ref: "User",
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
    },
    sentAt: {
      type: String,
      default: "00:00",
    },
    senderProfile: {
      type: String,
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "deleted"],
    },
  },
  {
    timestamps: true,
  }
);

//Export the model
const Chat = model("Chat", chatSchema);

module.exports = {
  Chat,
};
