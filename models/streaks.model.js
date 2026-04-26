const { Schema, model, Types } = require("mongoose");
// Declare the Schema of the Mongo model
const streakSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      index: true,
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive"],
    },
    name: {
      type: String,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    pastStreak: {
      type: Number,
    },
    currentStreakStarted: {
      type: Date,
    },
    lastUpdated : {
      type: Date,
      default: Date.now,
    },
    motivationMessage: {
      type: String,
      default: null,
    },
    motivationDate: {
      type: Date,
      default: null,
    }
  },
  { timestamps: true }
);

//Export the model
const Streak = model("Streak", streakSchema);

module.exports = {
  Streak,
};
