const jwt = require('jsonwebtoken')

// Public links used inside emails.
// The "Download PDF" button in an email must work without logging in, so the link
// carries a signed, expiring token that only unlocks that one order's receipt.

const apiUrl = () =>
    (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4001}`).trim().replace(/\/$/, '')

const frontendUrl = () =>
    (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '')

const RECEIPT_LINK_DAYS = 30

const signReceiptToken = (orderId) =>
    jwt.sign({ oid: String(orderId), use: 'receipt' }, process.env.JWT_SECRET, { expiresIn: `${RECEIPT_LINK_DAYS}d` })

// Returns the order id inside a valid token, or null.
const readReceiptToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        return decoded.use === 'receipt' ? decoded.oid : null
    } catch {
        return null
    }
}

const receiptDownloadUrl = (orderId) => `${apiUrl()}/api/v1/receipt/${signReceiptToken(orderId)}`
const orderPageUrl = (orderId) => `${frontendUrl()}/order/${orderId}`

module.exports = { receiptDownloadUrl, orderPageUrl, readReceiptToken, RECEIPT_LINK_DAYS }
