const User = require("../models/User");
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/ErrorHandler");
const AsyncError = require("../middleware/AsyncError");
const sendEmail = require("../utils/SendMail");
const crypto = require("crypto");
class UserController {
  static register = AsyncError(async (req, res, next) => {
    const { username, email, password, avatar } = req.body;
    if (!username || !email || !password) {
      return next(new ErrorHandler("All fields are required", 400));
    }

    let user = await User.findOne({ email });
    if (user) {
      return next(
        new ErrorHandler("User is already exist with this email.", 400)
      );
    }

    const myCloud = await cloudinary.v2.uploader.upload(avatar, {
      folder: "user",
    });

    user = await User.create({
      username,
      email,
      password,
      avatar: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
    });

    const authToken = await user.generateAuthToken();
    const options = {
      expires: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };
    res.status(201).cookie("authToken", authToken, options).json({
      success: true,
      message: "Register Successfully...",
      user,
      authToken,
    });
  });

  static login = AsyncError(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorHandler("All fields are required.", 400));
    }

    let user = await User.findOne({ email })
      .select("+password")
      .populate("articles");
    if (!user) {
      return next(new ErrorHandler("Login with correct credentials", 400));
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new ErrorHandler("Login with correct credentials", 400));
    }
    const authToken = await user.generateAuthToken();
    const options = {
      expires: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };
    res.status(200).cookie("authToken", authToken, options).json({
      success: true,
      user,
      authToken,
      message: "Logged in successfully",
    });
  });

  static logout = AsyncError(async (req, res, next) => {
    res
      .status(200)
      .cookie("authToken", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
      })
      .json({
        success: true,
        message: "Logged out Successfully",
      });
  });

  static myProfile = AsyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id).populate("articles");
    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }

    res.status(200).json({ success: true, user });
  });

  static updateProfile = AsyncError(async (req, res, next) => {
    const { username, email, avatar } = req.body;
    let user = await User.findById(req.user._id);
    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }

    if (username) {
      user.username = username;
    }
    if (email) {
      user.email = email;
    }
    if (avatar) {
      await cloudinary.v2.uploader.destroy(user.avatar.public_id);
      const result = await cloudinary.v2.uploader.upload(avatar, {
        folder: "user",
      });
      user.avatar.public_id = result.public_id;
      user.avatar.url = result.secure_url;
    }

    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Profile updated successfully." });
  });

  static updatePassword = AsyncError(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;
    let user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }
    if (!oldPassword || !newPassword) {
      return next(
        new ErrorHandler(
          "Old password and New Password both are required.",
          400
        )
      );
    }

    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return next(new ErrorHandler("Old Password is incorrect.", 400));
    } else {
      user.password = newPassword;
    }
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Password changed successfully." });
  });

  static forgotPassword = AsyncError(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
      return next(new ErrorHandler("Email is required.", 400));
    }
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }
    const getToken = user.getResetPasswordToken();
    await user.save();

    const url = `http://localhost:3000/password/reset/${getToken}`;
    // const url = `${req.protocol}://${req.get("host")}/api/v1/3000/${getToken}`;
    const message = `To reset your password , please follow the link below:\n\n${url}\n\n
    
    We recommend that you keep your password secure and not share it with anyone. If you feel your password has been compromised, you can change it by going to your My Profile Page and clicking on the "Change Password" link.\n\n
    Thank you.
    `;
    try {
      sendEmail({
        email: user.email,
        subject: `Resetting your password for Blog`,
        message,
      });
      res.status(200).json({
        success: true,
        message: `Reset password url sent on ${user.email} successfully.`,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return next(new ErrorHandler(error.message, 500));
    }
  });

  static resetPassword = AsyncError(async (req, res, next) => {
    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword) {
      return next(
        new ErrorHandler("Please enter password and confirm Password", 400)
      );
    }
    if (password !== confirmPassword) {
      return next(
        new ErrorHandler("Password and confirm password must be same.", 400)
      );
    }

    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
      return next(
        new ErrorHandler(
          "Your Reset password token is invalid or has been expired.",
          400
        )
      );
    }

    if (user.resetPasswordExpire > Date.now() + 5 * 60 * 1000) {
      return next(
        new ErrorHandler("Your Reset password token has been expired.", 400)
      );
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Your password reset successfully" });
  });

  static getUser = AsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id).populate("articles");
    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }
    res.status(200).json({ success: true, user });
  });
}

module.exports = UserController;
