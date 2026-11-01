const nodemailer = require('nodemailer');

// Sends an email with Nodemailer over SMTP. The SMTP_* settings point at a
// Mailtrap sandbox inbox (see backend/.env.example): emails are caught there
// for testing and never reach real inboxes. Swap in a production SMTP
// provider's host/port/user/pass to deliver to real customers.
// options: { email, subject, message, html?, attachments? }

let transporter = null;
const getTransporter = () => {
    if (transporter) return transporter;
    const port = Number(process.env.SMTP_PORT) || 2525;
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465, // 465 = SSL, 2525/587 = STARTTLS
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 30000
    });
    return transporter;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The Mailtrap free sandbox only accepts a few emails per second and answers
// "550 Too many emails per second" when you go faster (e.g. an order email right
// after a login code). That is temporary, so we wait a moment and try again.
const isRateLimit = (err) => /too many|rate limit|throttl/i.test(`${err && err.message} ${err && err.response}`);

const sendEmail = async (options) => {
    const mail = {
        from: process.env.SMTP_FROM || 'EriWork <noreply@eriwork.local>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html || `<p style="font-family:Arial,sans-serif;white-space:pre-line">${options.message}</p>`,
        attachments: options.attachments || []
    };

    const maxAttempts = 4;
    for (let attempt = 1; ; attempt++) {
        try {
            const info = await getTransporter().sendMail(mail);
            console.log('Email sent:', options.subject, '->', options.email);
            return info;
        } catch (err) {
            if (attempt >= maxAttempts || !isRateLimit(err)) throw err;
            await sleep(1500 * attempt);
        }
    }
};

module.exports = sendEmail;
