const { Schema, model, Types } = require("mongoose");

const checkinSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    rawText: { type: String, required: true },
    moodScore: { type: Number, min: 1, max: 10 },
    themes: [{ type: String }],
  },
  { timestamps: true }
);

const Checkin = model("Checkin", checkinSchema);
module.exports = { Checkin };
