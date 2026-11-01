const crypto = require('crypto')
const Otp = require('../models/otp')
const sendEmail = require('./sendEmail')
const buildOtpEmail = require('./otpEmail')

const CODE_LENGTH = 6
const OTP_TTL_MINUTES = 5          // how long a code stays valid
const RESEND_COOLDOWN_SECONDS = 30 // minimum gap between two codes for the same email + purpose
const MAX_ATTEMPTS = 5             // wrong guesses allowed before the code is destroyed

const emailConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

// Keyed hash: even someone who reads the database cannot reverse a 6-digit code without JWT_SECRET.
const hashCode = (email, purpose, code) =>
    crypto.createHmac('sha256', process.env.JWT_SECRET || 'eriwork-dev')
        .update(`${email}|${purpose}|${code}`).digest('hex')

const makeError = (statusCode, message) => Object.assign(new Error(message), { statusCode })

// Creates a code, stores its hash and emails it. Throws an error with a statusCode on failure.
async function issueOtp({ email, purpose, name }) {
    if (!emailConfigured()) {
        throw makeError(503, 'Email is not set up on the server, so a verification code cannot be sent. Fill in SMTP_USER and SMTP_PASS in backend/.env and restart the API.')
    }

    const existing = await Otp.findOne({ email, purpose })
    if (existing) {
        const waited = (Date.now() - existing.createdAt.getTime()) / 1000
        if (waited < RESEND_COOLDOWN_SECONDS) {
            const left = Math.ceil(RESEND_COOLDOWN_SECONDS - waited)
            throw makeError(429, `Please wait ${left} second${left === 1 ? '' : 's'} before asking for another code`)
        }
    }

    const code = String(crypto.randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, '0')
    await Otp.findOneAndUpdate(
        { email, purpose },
        {
            codeHash: hashCode(email, purpose, code),
            attempts: 0,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    )

    // Handy while developing: you can also read the code in this terminal.
    if (process.env.NODE_ENV !== 'production') console.log(`[OTP] ${purpose} code for ${email}: ${code}`)

    try {
        const { subject, html, text } = buildOtpEmail({ code, purpose, name, minutes: OTP_TTL_MINUTES })
        await sendEmail({ email, subject, message: text, html })
    } catch (err) {
        await Otp.deleteOne({ email, purpose })
        console.log('OTP email failed:', err.message)
        throw makeError(500, 'Could not send the verification email. Check the SMTP settings in backend/.env')
    }

    return { expiresInSeconds: OTP_TTL_MINUTES * 60, resendInSeconds: RESEND_COOLDOWN_SECONDS }
}

// Checks a code. A correct code is consumed (it works once). Throws with a statusCode when wrong.
async function verifyOtp({ email, purpose, code }) {
    const clean = String(code || '').replace(/\s/g, '')
    if (!/^\d{6}$/.test(clean)) throw makeError(400, 'Enter the 6-digit code from your email')

    const record = await Otp.findOne({ email, purpose })
    if (!record || record.expiresAt < new Date()) {
        throw makeError(400, 'This code has expired. Request a new one.')
    }
    if (record.attempts >= MAX_ATTEMPTS) {
        await Otp.deleteOne({ _id: record._id })
        throw makeError(429, 'Too many wrong attempts. Request a new code.')
    }

    const expected = Buffer.from(record.codeHash, 'hex')
    const given = Buffer.from(hashCode(email, purpose, clean), 'hex')
    if (!crypto.timingSafeEqual(expected, given)) {
        record.attempts += 1
        await record.save()
        const left = MAX_ATTEMPTS - record.attempts
        if (left <= 0) {
            await Otp.deleteOne({ _id: record._id })
            throw makeError(429, 'Too many wrong attempts. Request a new code.')
        }
        throw makeError(400, `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left.`)
    }

    await Otp.deleteOne({ _id: record._id }) // one use only
    return true
}

module.exports = { issueOtp, verifyOtp, OTP_TTL_MINUTES, RESEND_COOLDOWN_SECONDS }
