const { Schema, model, Types } = require("mongoose");

const crisisFlagSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    messageContent: { type: String, required: true },
    severity: { type: String, enum: ["concerning", "crisis"], required: true },
    source: { type: String, enum: ["ai_chat", "consultant_chat"], default: "ai_chat" },
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

const CrisisFlag = model("CrisisFlag", crisisFlagSchema);
module.exports = { CrisisFlag };
