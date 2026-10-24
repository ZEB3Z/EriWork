// Server-side input validation with the `validator` package.
// The frontend validates too (React Hook Form + Yup), but the API must never
// trust the browser, so every write endpoint checks its input here as well.
const validator = require('validator')
const { CATEGORIES } = require('../models/product')

const str = (v) => (v === undefined || v === null ? '' : String(v))

// Each check returns an error message, or null if the value is fine.
const checks = {
    name: (v) => {
        const s = str(v).trim()
        if (validator.isEmpty(s)) return 'Please enter your name'
        if (!validator.isLength(s, { max: 30 })) return 'Your name cannot exceed 30 characters'
        return null
    },
    email: (v) => (validator.isEmail(str(v).trim()) ? null : 'Please enter a valid email address'),
    password: (v) => (validator.isLength(str(v), { min: 6, max: 128 }) ? null : 'Password must be at least 6 characters'),
    productName: (v) => (validator.isLength(str(v).trim(), { min: 1, max: 100 }) ? null : 'Product name must be 1–100 characters'),
    price: (v) => (validator.isFloat(str(v), { min: 0, max: 1000000 }) ? null : 'Price must be a number of 0 or more'),
    stock: (v) => (validator.isInt(str(v), { min: 0, max: 1000000 }) ? null : 'Stock must be a whole number of 0 or more'),
    category: (v) => (validator.isIn(str(v), CATEGORIES) ? null : 'Please select a valid category'),
    description: (v) => (validator.isLength(str(v).trim(), { min: 1, max: 5000 }) ? null : 'Please enter a description (up to 5000 characters)'),
    seller: (v) => (validator.isLength(str(v).trim(), { min: 1, max: 100 }) ? null : 'Please enter the seller'),
    reviewComment: (v) => (validator.isLength(str(v).trim(), { min: 1, max: 1000 }) ? null : 'Your review must be 1–1000 characters'),
    mongoId: (v) => (validator.isMongoId(str(v)) ? null : 'Invalid id')
}

// Run several checks: validate(body, { email: 'email', password: 'password' })
// maps body fields to check names. Returns the first error message, or null.
// Fields listed in `optional` are only checked when present.
function validate(body, rules, optional = []) {
    for (const [field, check] of Object.entries(rules)) {
        const value = body[field]
        if (optional.includes(field) && (value === undefined || value === '')) continue
        const error = checks[check](value)
        if (error) return error
    }
    return null
}

const normalizeEmail = (email) => str(email).trim().toLowerCase()

module.exports = { validate, normalizeEmail, checks }
