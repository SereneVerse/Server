// resources include videos and articles

const { Schema, model, Types } = require("mongoose");

// Declare the Schema of the Mongo model
const resourceSchema = new Schema(
  {
    datePosted: {
      type: Date,
      required: true,
    },
    author: {
      type: String,
    },
    description: {
      type: String,
    },
    link: {
      type: String,
    },
    type: {
      type: String,
      required: true,
      enum: ["video", "article"],
    },
    postedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

//Export the model
const Resource = model("Resource", resourceSchema);

module.exports = {
  Resource,
};
