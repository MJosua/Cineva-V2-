const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function sendConfirmationEmail(to, subject, text) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  return transporter.sendMail(mailOptions);
}

function sendReminderEmail(to, name, roomName, time) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `Reminder: Meeting in Room ${roomName} at ${time}`,
    text: `Hi ${name},\n\nThis is a reminder that your meeting in Room ${roomName} starts at ${time}.\n\n– IndoFood Booking System`,
  };

  return transporter.sendMail(mailOçptions);
}

module.exports = {
  sendConfirmationEmail,
  sendReminderEmail,
};
