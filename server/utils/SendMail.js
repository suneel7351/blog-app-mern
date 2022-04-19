const nodemailer = require("nodemailer");
const AsyncError = require("../middleware/AsyncError");
require("dotenv").config({ path: "../config/.env" });

async function sendEmail(options) {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,

    auth: {
      user: "demorajput1666@gmail.com",
      pass: "udaybharti1666",
    },
    service: process.env.MAIL_SERVICE,
    // host: process.env.SMPT_HOST,
    // port: process.env.SMPT_PORT,
    // secure: true,
    // auth: {
    //   user: process.env.EMAIL_USER,
    //   pass: process.env.EMAIL_PASS,
    // },
    // service: process.env.MAIL_SERVICE,
  });

  await transporter.sendMail({
    // from: process.env.EMAIL_USER,
    from: "demorajput1666@gmail.com",
    to: options.email,
    subject: options.subject,
    text: options.message,
  });
}

module.exports = sendEmail;
