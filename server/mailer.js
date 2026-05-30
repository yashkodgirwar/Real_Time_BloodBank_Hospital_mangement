const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'bloodlinkyash@gmail.com',
    pass: 'smlg jqcs idcj nxgi'
  },
  connectionTimeout: 10000, // 10 seconds connection timeout
  socketTimeout: 15000,     // 15 seconds socket inactivity timeout
  greetingTimeout: 10000    // 10 seconds greeting timeout
});

async function sendEmail(to, subject, html, attachments = []) {
  console.log(`[Mailer] Attempting to send email to: ${to} | Subject: "${subject}"`);
  try {
    const info = await transporter.sendMail({
      from: '"BloodLink" <bloodlinkyash@gmail.com>',
      to,
      subject,
      html,
      attachments
    });
    console.log(`[Mailer] Email sent successfully to: ${to} | MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[Mailer] Error sending email to ${to}:`, error);
    throw error;
  }
}

module.exports = sendEmail;
