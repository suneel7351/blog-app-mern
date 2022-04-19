const express = require("express");
const {
  getPosts,
  getPost,
  deletePost,
} = require("../controller/PostController");
const PostController = require("../controller/PostController");
const Authenticate = require("../middleware/Authenticate");
const router = express.Router();

router.route("/post/new").post(Authenticate, PostController.createPost);
router.route("/post/update/:id").put(Authenticate, PostController.updatePost);
router.route("/posts").get(getPosts);
router.route("/post/:id").get(getPost).delete(deletePost);
router
  .route("/post/comment/:id")
  .put(Authenticate, PostController.commentOnPost)
  .delete(Authenticate, PostController.deleteComment);

module.exports = router;
