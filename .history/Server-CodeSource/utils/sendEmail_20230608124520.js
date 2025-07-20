const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  let testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: "koussaila.502@gmail.com",
      pass: 'eqphwdpkadrgotxf',
    },
  });
  return transporter.sendMail({
    from: 'koussaila.502@gmail.com', // sender address
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
