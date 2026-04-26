const { Schema, model, Types } = require("mongoose");

const messageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { _id: false }
);

const aiThreadSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    messages: [messageSchema],
  },
  { timestamps: true }
);

const AIThread = model("AIThread", aiThreadSchema);
module.exports = { AIThread };
