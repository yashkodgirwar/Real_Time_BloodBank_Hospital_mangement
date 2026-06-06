const nodemailer = require('nodemailer');
const https = require('https');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'bloodlinkyash@gmail.com',
    pass: process.env.SMTP_PASS || 'smlg jqcs idcj nxgi'
  },
  connectionTimeout: 10000, // 10 seconds connection timeout
  socketTimeout: 15000,     // 15 seconds socket inactivity timeout
  greetingTimeout: 10000    // 10 seconds greeting timeout
});

function sendViaResend(to, subject, html, attachments = []) {
  return new Promise((resolve, reject) => {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'BloodLink <onboarding@resend.dev>';
    
    const resendAttachments = attachments.map(att => {
      let content = att.content;
      if (Buffer.isBuffer(content)) {
        content = content.toString('base64');
      }
      return {
        filename: att.filename,
        content: content
      };
    });

    const postData = JSON.stringify({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: html,
      attachments: resendAttachments
    });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            resolve({ messageId: parsed.id, response: 'OK', accepted: [to] });
          } catch (e) {
            resolve({ response: 'OK', accepted: [to] });
          }
        } else {
          reject(new Error(`Resend API returned status code ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function sendEmail(to, subject, html, attachments = []) {
  if (process.env.RESEND_API_KEY) {
    console.log(`[Mailer] Attempting to send email via Resend API to: ${to} | Subject: "${subject}"`);
    try {
      const info = await sendViaResend(to, subject, html, attachments);
      console.log(`[Mailer] Email sent successfully via Resend to: ${to} | MessageId: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`[Mailer] Resend API Error sending email to ${to}:`, error);
      throw error;
    }
  } else {
    console.log(`[Mailer] Attempting to send email via Gmail SMTP to: ${to} | Subject: "${subject}"`);
    try {
      const info = await transporter.sendMail({
        from: `"BloodLink" <${process.env.SMTP_USER || 'bloodlinkyash@gmail.com'}>`,
        to,
        subject,
        html,
        attachments
      });
      console.log(`[Mailer] Email sent successfully via SMTP to: ${to} | MessageId: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`[Mailer] SMTP Error sending email to ${to}:`, error);
      throw error;
    }
  }
}

module.exports = sendEmail;
