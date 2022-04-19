const mongoose = require("mongoose");
const { Schema } = mongoose;

const postSchema = new Schema({
  title: {
    type: String,
    required: [true, "Please write post title."],
    minlength: [16, "Title must be atleast 16 character long."],
    maxlength: [100, "Title can not more than 100 character long."],
  },
  description: {
    type: String,
    required: [true, "Please write post description."],
    minlength: [60, "Description must be 60 character long."],
  },

  images: {
    public_id: String,
    url: String,
  },

  category: {
    type: String,
    required: [true, "Please Enter Post Category"],
  },

  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Post", postSchema);
