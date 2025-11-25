// server/src/configmail/mail.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
console.log("SMTP PASS (debug):", process.env.SMTP_PASS);
export default transporter;
