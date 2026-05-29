const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'bloodlinkyash@gmail.com',
    pass: 'smlg jqcs idcj nxgi'
  }
});

async function sendEmail(to, subject, html, attachments = []) {
  await transporter.sendMail({
    from: '"BloodLink" <bloodlinkyash@gmail.com>',
    to,
    subject,
    html,
    attachments
  });
}

module.exports = sendEmail;
