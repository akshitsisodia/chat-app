const nodemailer = require("nodemailer");
const sendEmail = async (option) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // Use true for port 465, false for port 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Send an email using async/await
  const mailOptions = {
    from: '"ChatApp support" <support@chatapp.com>',
    to: option.email,
    subject: option.subject,
    html: option.html, // HTML version of the message
  };

  await transporter.sendMail(mailOptions);
};
module.exports = sendEmail;
