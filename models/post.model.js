const { Schema, model, Types } = require("mongoose");

// Declare the Schema of the Mongo model
const postSchema = new Schema(
  {
    postedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    datePosted: {
      type: Date,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
    },
    comments: [
      {
        comment: String,
        madeBy: {
          type: Types.ObjectId,
          ref: "User",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

//Export the model
const Post = model("Post", postSchema);

module.exports = {
  Post,
};
