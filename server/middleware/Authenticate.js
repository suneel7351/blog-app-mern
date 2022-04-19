const jwt = require("jsonwebtoken");
require("dotenv").config({ path: "../config/.env" });
const User = require("../models/User");

async function Authenticate(req, res, next) {
  try {
    const { authToken } = req.cookies;
    if (!authToken) {
      return res.status(401).json({
        success: false,
        message: "Please login with correct credentials",
      });
    }
    const data = jwt.verify(authToken, process.env.JWT_SECERET);

    req.user = await User.findById(data.id);
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = Authenticate;
