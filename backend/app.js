const express = require('express')
const path = require('path')
const cors = require('cors')

const products = require('./routes/product')
const auth = require('./routes/auth')
const order = require('./routes/order')

const app = express()

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Uploaded product images and avatars
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

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
        return res.status(413).json({ message: 'Upload is too large. Please use smaller images.' })
    }
    console.error('Unhandled error:', err)
    res.status(err.statusCode || 500).json({ message: err.message || 'Internal server error' })
})

module.exports = app
