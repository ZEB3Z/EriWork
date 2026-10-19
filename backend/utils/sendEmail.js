const nodemailer = require('nodemailer');

// Sends an email using the SMTP settings in config/.env (e.g. Mailtrap).
// options: { email, subject, message, html?, attachments? }
const sendEmail = async (options) => {
    const port = Number(process.env.SMTP_PORT) || 587;

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465, // 465 = SSL, 587/2525 = STARTTLS
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });

    const info = await transporter.sendMail({
        from: `${process.env.SMTP_FROM_NAME || 'EriWork'} <${process.env.SMTP_FROM_EMAIL || 'noreply@eriwork.local'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html || `<p style="font-family:Arial,sans-serif;white-space:pre-line">${options.message}</p>`,
        attachments: options.attachments || []
    });

    console.log('Email sent:', options.subject, '->', options.email);
    return info;
};

module.exports = sendEmail;
