const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
require("dotenv").config({ path: "../config/.env" });

const userSchema = new Schema({
  username: {
    type: String,
    required: [true, "Please Enter your username..."],
  },
  email: {
    type: String,
    required: [true, "Please Enter your email..."],
    unique: true,
  },
  avatar: {
    public_id: String,
    url: String,
  },
  password: {
    type: String,
    required: [true, "Please Enter your password..."],
    minlength: [6, "Password must be contains 6 character"],
    select: false,
  },
  articles: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  followings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.generateAuthToken = async function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECERET);
};

userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
  const getToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(getToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 5 * 60 * 1000;

  return getToken;
};

module.exports = mongoose.model("User", userSchema);
