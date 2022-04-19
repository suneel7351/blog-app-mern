const Post = require("../models/Post");
const cloudinary = require("cloudinary");
const mongoose = require("mongoose");
const User = require("../models/User");
const AsyncError = require("../middleware/AsyncError");
const ErrorHandler = require("../utils/ErrorHandler");
class PostController {
  static createPost = AsyncError(async (req, res) => {
    const { title, description, category, images } = req.body;

    const result = await cloudinary.v2.uploader.upload(images, {
      folder: "blog",
    });

    const post = new Post({
      title,
      description,
      category,
      // images: {
      //   public_id: "result.public_id,",
      //   url: "https://cdn.pixabay.com/photo/2019/05/14/17/07/web-development-4202909__340.png",
      // },
      images: {
        public_id: result.public_id,
        url: result.secure_url,
      },
      author: req.user._id,
    });

    const newPost = await post.save();
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }
    user.articles.unshift(newPost._id);
    await user.save();

    res
      .status(201)
      .json({ success: true, message: "Article Created Successfully" });
  });

  static getPosts = AsyncError(async (req, res, next) => {
    const post = await Post.find({
      category: {
        $regex: req.query.category,
        $options: "i",
      },
    }).populate("author");
    const posts = post.reverse();
    res.status(200).json({ success: true, posts });
  });
  static getPost = AsyncError(async (req, res, next) => {
    const post = await Post.findById(req.params.id).populate("author");
    if (!post) {
      return next(new ErrorHandler("Post not found.", 404));
    }

    res.status(200).json({ success: true, post });
  });

  static updatePost = AsyncError(async (req, res, next) => {
    const { title, description, category, images } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return next(new ErrorHandler("Post not found.", 404));
    }
    if (title) {
      post.title = title;
    }
    if (description) {
      post.description = description;
    }
    if (category) {
      post.category = category;
    }
    if (images) {
      await cloudinary.v2.uploader.destroy(post.images.public_id);
      const result = await cloudinary.v2.uploader.upload(images, {
        folder: "blog",
      });
      post.images.public_id = result.public_id;
      post.images.url = result.secure_url;
    }

    await post.save();
    res
      .status(201)
      .json({ success: true, message: "Article Updated Successfully" });
  });

  static deletePost = AsyncError(async (req, res, next) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return next(new ErrorHandler("Post not found.", 404));
    }

    await cloudinary.v2.uploader.destroy(post.images.public_id);

    await post.remove();
    res
      .status(200)
      .json({ success: true, message: "Article Deleted Successfully." });
  });

  static commentOnPost = AsyncError(async (req, res, next) => {
    let post = await Post.findById(req.params.id);
    const { comment } = req.body;
    if (!post) {
      return next(new ErrorHandler("Post not found.", 404));
    }
    if (!comment) {
      return next(new ErrorHandler("Comment is required.", 400));
    }
    // Check if comment already added
    let commentIndex = -1;
    post.comments.forEach((element, index) => {
      if (element.user.toString() === req.user._id.toString()) {
        commentIndex = index;
      }
    });

    if (commentIndex !== -1) {
      post.comments[commentIndex].comment = comment;
      await post.save();
      res
        .status(200)
        .json({ success: true, message: "Comment updated successfully." });
    } else {
      post.comments.push({
        user: req.user._id,
        comment,
      });
      await post.save();
      res
        .status(200)
        .json({ success: true, message: "Comment added successfully." });
    }
  });

  static deleteComment = AsyncError(async (req, res, next) => {
    const post = await Post.findById(req.params.id);
    const { commentId } = req.body;
    if (!post) {
      return next(new ErrorHandler("Post not found.", 404));
    }
    if (!commentId) {
      return next(new ErrorHandler("CommentId is required."));
    }
    // Author delete the comments

    if (post.author.toString() === req.user._id.toString()) {
      post.comments.forEach((element, index) => {
        if (element._id.toString() === commentId.toString()) {
          return post.comments.splice(index, 1);
        }
      });
      await post.save();
      res
        .status(200)
        .json({ success: true, message: "Comment deleted successfully." });
    } else {
      post.comments.forEach((element, index) => {
        if (element.user.toString() === req.user._id.toString()) {
          post.comments.splice(index, 1);
        }
      });
      await post.save();

      return res.status(200).json({
        success: true,
        message: "Your Comment has deleted",
      });
    }
  });
}

module.exports = PostController;
