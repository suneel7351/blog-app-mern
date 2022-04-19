const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const PostRoutes = require("./routes/PostRoutes");
const UserRoutes = require("./routes/UserRoutes");
const fileUpload = require("express-fileupload");
const Error = require("./middleware/Error");
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: "server/config/.env" });
}

app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

app.use("/api/v1", PostRoutes);
app.use("/api/v1", UserRoutes);
app.use(Error);
module.exports = app;
