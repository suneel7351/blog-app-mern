const express = require("express");
const UserController = require("../controller/UserController");
const Authenticate = require("../middleware/Authenticate");

const router = express.Router();

router.route("/user/new").post(UserController.register);
router.route("/user/logout").get(Authenticate, UserController.logout);
router.route("/user/login").post(UserController.login);

router.route("/user/me").get(Authenticate, UserController.myProfile);
router
  .route("/user/me/password/update")
  .put(Authenticate, UserController.updatePassword);
router
  .route("/user/me/profile/update")
  .put(Authenticate, UserController.updateProfile);

router.route("/password/forgot").post(UserController.forgotPassword);

router.route("/user/:id").get(Authenticate, UserController.getUser);

router.route("/password/reset/:token").put(UserController.resetPassword);

module.exports = router;
