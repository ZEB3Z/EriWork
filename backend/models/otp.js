const mongoose = require('mongoose')

// One-time passcodes. Only a hash of the code is stored, never the code itself.
// MongoDB deletes each document by itself once expiresAt has passed (TTL index).
const PURPOSES = ['register', 'login', 'reset', 'checkout', 'password']

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: { type: String, required: true, enum: PURPOSES },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
})

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
otpSchema.index({ email: 1, purpose: 1 }, { unique: true }) // one live code per email + purpose

module.exports = mongoose.model('Otp', otpSchema)
module.exports.PURPOSES = PURPOSES
