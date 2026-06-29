const nodemailer = require('nodemailer');

let transporter;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Use Ethereal fake SMTP for development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Ethereal email account:', testAccount.user);
  }

  return transporter;
}

async function sendEmail({ to, subject, html }) {
  try {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: process.env.EMAIL_FROM || '"VSM System" <noreply@vsm.com>',
      to,
      subject,
      html,
    });
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Email preview URL:', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (err) {
    console.error('Email send error:', err.message);
  }
}

module.exports = { sendEmail };
