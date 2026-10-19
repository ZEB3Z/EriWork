const User = require('../models/user')
const jwt = require("jsonwebtoken")

exports.isAuthenticatedUser = async (req, res, next) => {
    // Read the Bearer token safely. A missing/!Bearer header must NOT crash
    // the request (the old `.split(' ')` on undefined did exactly that).
    const authHeader = req.header('Authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null

    if (!token) {
        return res.status(401).json({ message: 'Login first to access this resource' })
    }

    // An invalid/expired/wrong-secret token should return a clean 401,
    // not an unhandled error.
    let decoded
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
        return res.status(401).json({ message: 'Your session is invalid or has expired. Please log in again.' })
    }

    // The token is valid, but the user it points to may no longer exist
    // (e.g. the database was re-seeded, giving accounts new IDs). Handle
    // that instead of letting `req.user` be null and crashing later.
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
