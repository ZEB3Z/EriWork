const User = require('../models/user')
const jwt = require('jsonwebtoken')

// The session token normally arrives in the httpOnly "token" cookie (set by
// sendToken in controllers/auth.js and parsed by cookie-parser).
// As a fallback the API also accepts "Authorization: Bearer <token>", for
// browsers that block cross-site cookies (e.g. Safari when the API and the
// website are on two different onrender.com subdomains).
const readToken = (req) => {
    if (req.cookies && req.cookies.token) return req.cookies.token
    const authHeader = req.header('Authorization') || ''
    return authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
}

exports.isAuthenticatedUser = async (req, res, next) => {
    const token = readToken(req)
    if (!token) {
        return res.status(401).json({ message: 'Login first to access this resource' })
    }

    // An invalid/expired/wrong-secret token returns a clean 401, not a crash.
    let decoded
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
        return res.status(401).json({ message: 'Your session is invalid or has expired. Please log in again.' })
    }

    // The token is valid, but the user may no longer exist (e.g. after re-seeding).
    const user = await User.findById(decoded.id)
    if (!user) {
        return res.status(401).json({ message: 'Your account was not found. Please log out and log in again.' })
    }

    req.user = user
    next()
}

exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            const role = req.user ? req.user.role : 'guest'
            return res.status(403).json({ message: `Role (${role}) is not allowed to access this resource` })
        }
        next()
    }
}
