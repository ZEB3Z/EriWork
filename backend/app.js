const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const multer = require('multer')

const products = require('./routes/product')
const auth = require('./routes/auth')
const order = require('./routes/order')

const app = express()

// Render (like most hosts) sits behind a proxy that terminates HTTPS.
app.set('trust proxy', 1)

// CORS: only the website's own origin(s) may call the API, with cookies.
// FRONTEND_URL can hold several origins separated by commas, e.g.
// "https://eriwork-web.onrender.com,http://localhost:5173".
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean)

app.use(cors({
    origin: (origin, callback) => {
        // Requests with no Origin header (curl, Render health checks) are allowed.
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
        callback(null, false) // browser blocks it; logged below to help debugging
        console.log(`CORS: blocked request from ${origin}. Add it to FRONTEND_URL if it's your website.`)
    },
    credentials: true // allow the session cookie to travel cross-site
}))
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ limit: '1mb', extended: true }))

// Render health check (see render.yaml) — also handy for waking a sleeping free instance.
app.get('/api/v1/health', (req, res) => res.status(200).json({ status: 'ok' }))

app.use('/api/v1', products)
app.use('/api/v1', auth)
app.use('/api/v1', order)

// Unknown API route
app.use('/api/v1', (req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
})

// Error handler — turns any thrown error into a readable JSON message.
// (Express 5 forwards errors from async controllers here automatically.)
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        const messages = {
            LIMIT_FILE_SIZE: 'Each image must be 5 MB or smaller',
            LIMIT_FILE_COUNT: 'You can upload up to 10 images at a time',
            LIMIT_UNEXPECTED_FILE: 'Unexpected file field in the upload'
        }
        return res.status(400).json({ message: messages[err.code] || err.message })
    }
    if (err.name === 'ValidationError') {
        const first = Object.values(err.errors)[0]
        return res.status(400).json({ message: first ? first.message : 'Invalid data' })
    }
    if (err.name === 'CastError') {
        return res.status(400).json({ message: `Invalid ${err.path}` })
    }
    if (err.code === 11000) {
        return res.status(400).json({ message: 'That email is already registered' })
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ message: 'Request is too large.' })
    }
    if (err.statusCode && err.statusCode < 500) {
        return res.status(err.statusCode).json({ message: err.message })
    }
    console.error('Unhandled error:', err)
    res.status(err.statusCode || 500).json({ message: err.message || 'Internal server error' })
})

module.exports = app
