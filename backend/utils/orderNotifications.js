const sendEmail = require('./sendEmail');
const buildOrderEmail = require('./orderEmail');
const generateReceiptPdf = require('./receiptPdf');

const emailConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_EMAIL);

// Emails the customer an order summary with the PDF receipt attached.
// type: 'placed' or 'status'. Never throws — email problems must not break orders.
async function sendOrderEmail(order, user, type) {
    if (!user || !user.email) return false;
    if (!emailConfigured()) {
        console.log('SMTP not configured — skipping order email.');
        return false;
    }
    try {
        const { subject, html, text } = buildOrderEmail(order, user, type);
        const pdf = await generateReceiptPdf(order, user);
        await sendEmail({
            email: user.email,
            subject,
            message: text,
            html,
            attachments: [{
                filename: `EriWork-Receipt-${String(order._id).slice(-8).toUpperCase()}.pdf`,
                content: pdf,
                contentType: 'application/pdf'
            }]
        });
        return true;
    } catch (err) {
        console.log('Order email failed (order is still saved):', err.message);
        return false;
    }
}

module.exports = { sendOrderEmail };
