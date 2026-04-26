const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    userName : {
      type : String
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    displayImage: {
      type: String,
    },
    phone: {
      type: String,
      index: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    dateOfBirth: {
      type: Date,
    },
    hash: {
      type: String,
    },
    loginScheme: {
      type: String,
      required: true,
      enum: ["email", "google"],
    },
    status : {
      type : String,
      default: "complete",
      enum: ["complete", "pending"],
    },
    expertsContacted: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    streaks : [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Streak",
      }
    ],
    role: {
      type: Number,
      required: true,
      enum: [1, 2, 3],
      index: true,
    },
    refreshToken: {
      type: String,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    aiSummary: {
      type: String,
      default: null,
    },
    aiSummaryGeneratedAt: {
      type: Date,
      default: null,
    },
    otp: {
      type: String,
    },
    otpCreatedAt: {
      type: Number,
    },
    otpExpiresIn: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

//Export the model
const User = mongoose.model("User", userSchema);

module.exports = {
  User,
};
