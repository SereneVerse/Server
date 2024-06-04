const { Schema, model, Types } = require("mongoose");
// Declare the Schema of the Mongo model
const streakSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
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
      default: Date.now(),
    }
  },
  { timestamps: true }
);

//Export the model
const Streak = model("Streak", streakSchema);

module.exports = {
  Streak,
};
