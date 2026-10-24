const nodemailer = require('nodemailer');

// Sends an email with Nodemailer over SMTP. The SMTP_* settings point at a
// Mailtrap sandbox inbox (see backend/.env.example): emails are caught there
// for testing and never reach real inboxes. Swap in a production SMTP
// provider's host/port/user/pass to deliver to real customers.
// options: { email, subject, message, html?, attachments? }
const sendEmail = async (options) => {
    const port = Number(process.env.SMTP_PORT) || 2525;

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465, // 465 = SSL, 2525/587 = STARTTLS
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        connectionTimeout: 15000
    });

    const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || 'EriWork <noreply@eriwork.local>',
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
