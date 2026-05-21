const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendTemporaryPassword(email, name, password) {
  const mailOptions = {
    from: `"DevHub" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Your temporary password for DevHub",
    html: `<p>Hello ${name},</p>
           <p>Your account has been created. Your temporary password is:</p>
           <h2>${password}</h2>
           <p>You will be asked to change it on your first login.</p>`,
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendTemporaryPassword };