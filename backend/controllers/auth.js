const crypto = require('crypto')
const User = require('../models/user')
const { DEFAULT_AVATAR } = require('../models/user')
const { uploadBuffer, destroyImage } = require('../config/cloudinary')
const { validate, normalizeEmail } = require('../utils/validate')
const { verifyFirebaseToken, firebaseConfigured, SOCIAL_PROVIDERS } = require('../utils/firebase')
const { issueOtp, verifyOtp } = require('../utils/otp')

// Cookie settings. In production the website (Render Static Site) and the API
// (Render Web Service) live on different onrender.com subdomains, which browsers
// treat as different sites — so the cookie must be SameSite=None and Secure.
// Locally both run on localhost over plain http, where Lax works.
const cookieOptions = () => {
    const production = process.env.NODE_ENV === 'production'
    return {
        httpOnly: true,                       // JavaScript can't read it
        secure: production,                   // HTTPS only in production
        sameSite: production ? 'none' : 'lax',
        path: '/'
    }
}

// Log the user in: set the JWT as an httpOnly cookie and send the user back.
// The token is also returned in the body so browsers that block cross-site
// cookies can fall back to the Authorization header (see middlewares/auth.js).
const sendToken = (user, statusCode, res) => {
    const token = user.getJwtToken()
    const days = Number(process.env.COOKIE_EXPIRE) || 7
    res.status(statusCode)
        .cookie('token', token, { ...cookieOptions(), maxAge: days * 24 * 60 * 60 * 1000 })
        .json({ success: true, token, user })
}

// Upload the avatar Multer received (if any) to Cloudinary.
const saveAvatar = (file) => (file ? uploadBuffer(file.buffer, 'avatars') : null)

// POST /register/otp  { name, email, password } — step 1 of sign-up.
// Checks the details and emails a 6-digit code. Nothing is saved yet.
exports.requestRegisterOtp = async (req, res) => {
    const error = validate(req.body, { name: 'name', email: 'email', password: 'password' })
    if (error) return res.status(400).json({ message: error })

    const email = normalizeEmail(req.body.email)
    if (await User.findOne({ email })) { // includes deleted accounts: their email stays reserved until restored or removed for good
        return res.status(400).json({ message: 'An account with this email already exists' })
    }
    const info = await issueOtp({ email, purpose: 'register', name: req.body.name.trim() })
    res.status(200).json({ success: true, message: `We sent a 6-digit code to ${email}`, ...info })
}

// POST /register  multipart: { name, email, password, otp, avatar? (file) } — step 2 of sign-up.
// The account is only created when the emailed code is correct.
exports.registerUser = async (req, res) => {
    const { name, password } = req.body
    const error = validate(req.body, { name: 'name', email: 'email', password: 'password' })
    if (error) return res.status(400).json({ message: error })

    const email = normalizeEmail(req.body.email)
    if (await User.findOne({ email })) {
        return res.status(400).json({ message: 'An account with this email already exists' })
    }
    await verifyOtp({ email, purpose: 'register', code: req.body.otp })

    const avatar = (await saveAvatar(req.file)) || DEFAULT_AVATAR
    let user
    try {
        user = await User.create({ name: name.trim(), email, password, avatar })
    } catch (err) {
        await destroyImage(avatar.public_id)
        throw err
    }
    sendToken(user, 201, res)
}

// POST /login  { email, password } — step 1: check the password, then email a code.
exports.loginUser = async (req, res) => {
    const { password } = req.body
    if (!req.body.email || !password) {
        return res.status(400).json({ message: 'Please enter email and password' })
    }
    const error = validate(req.body, { email: 'email' })
    if (error) return res.status(400).json({ message: error })

    const email = normalizeEmail(req.body.email)
    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.comparePassword(String(password)))) {
        return res.status(401).json({ message: 'Invalid email or password' })
    }
    if (user.deletedAt) {
        return res.status(403).json({ message: 'This account has been deleted. Please contact support.' })
    }
    const info = await issueOtp({ email, purpose: 'login', name: user.name })
    res.status(200).json({ success: true, otpRequired: true, email, message: `We sent a 6-digit code to ${email}`, ...info })
}

// POST /login/verify  { email, otp } — step 2: the right code logs you in.
// A code only exists after a correct password (step 1), so this is safe on its own.
exports.verifyLogin = async (req, res) => {
    const error = validate(req.body, { email: 'email' })
    if (error) return res.status(400).json({ message: error })

    const email = normalizeEmail(req.body.email)
    await verifyOtp({ email, purpose: 'login', code: req.body.otp })

    const user = await User.findOne({ email, deletedAt: null })
    if (!user) return res.status(401).json({ message: 'Account not found' })
    sendToken(user, 200, res)
}

// POST /otp/send  { purpose: 'checkout' | 'password' } — logged-in users ask for a code
// to confirm a sensitive action. It always goes to the email on their own account.
exports.sendActionOtp = async (req, res) => {
    const { purpose } = req.body
    if (!['checkout', 'password'].includes(purpose)) {
        return res.status(400).json({ message: 'Unknown verification purpose' })
    }
    const info = await issueOtp({ email: req.user.email, purpose, name: req.user.name })
    res.status(200).json({ success: true, message: `We sent a 6-digit code to ${req.user.email}`, email: req.user.email, ...info })
}

// GET /logout — clears the session cookie
exports.logoutUser = async (req, res) => {
    res.clearCookie('token', cookieOptions())
    res.status(200).json({ success: true, message: 'Logged out' })
}

// POST /login/social  { idToken } — Google or Facebook sign-in through Firebase.
// Firebase is only used to prove who the user is; after that, the app's own
// JWT cookie session takes over (sendToken), exactly like email/password login.
exports.socialLogin = async (req, res) => {
    if (!firebaseConfigured()) {
        return res.status(503).json({ message: 'Social sign-in is not configured on the server (FIREBASE_PROJECT_ID missing)' })
    }
    if (!req.body.idToken || typeof req.body.idToken !== 'string') {
        return res.status(400).json({ message: 'Missing sign-in token' })
    }

    let decoded
    try {
        decoded = await verifyFirebaseToken(req.body.idToken)
    } catch (err) {
        return res.status(401).json({ message: 'Sign-in failed. Please try again.' })
    }

    const providerId = decoded.firebase && decoded.firebase.sign_in_provider
    const provider = SOCIAL_PROVIDERS[providerId]
    if (!provider) {
        return res.status(400).json({ message: 'Please sign in with Google or Facebook' })
    }
    if (!decoded.email) {
        return res.status(400).json({ message: `Your ${provider} account has no email address. Add one to your ${provider} account, or register with email and password.` })
    }

    // Log in the existing account, or create one the first time.
    const email = normalizeEmail(decoded.email)
    let user = await User.findOne({ email })
    if (user && user.deletedAt) {
        return res.status(403).json({ message: 'This account has been deleted. Please contact support.' })
    }
    if (!user) {
        user = await User.create({
            name: (decoded.name || email.split('@')[0]).slice(0, 30),
            email,
            password: crypto.randomBytes(24).toString('hex'), // never used; they sign in with Google/Facebook
            // External profile photo: its public_id is outside our Cloudinary folder, so it's never deleted.
            avatar: decoded.picture
                ? { public_id: `social/${providerId}`, url: decoded.picture }
                : DEFAULT_AVATAR
        })
    }
    sendToken(user, 200, res)
}

// POST /password/forgot  { email } — emails a 6-digit reset code.
exports.forgotPassword = async (req, res) => {
    const error = validate(req.body, { email: 'email' })
    if (error) return res.status(400).json({ message: error })

    const email = normalizeEmail(req.body.email)
    const user = await User.findOne({ email, deletedAt: null })
    if (!user) {
        return res.status(404).json({ message: 'No account found with this email' })
    }
    const info = await issueOtp({ email, purpose: 'reset', name: user.name })
    res.status(200).json({ success: true, message: `We sent a 6-digit code to ${email}`, ...info })
}

// PUT /password/reset  { email, otp, password, confirmPassword }
exports.resetPassword = async (req, res) => {
    const error = validate(req.body, { email: 'email', password: 'password' })
    if (error) return res.status(400).json({ message: error })
    if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' })
    }

    const email = normalizeEmail(req.body.email)
    const user = await User.findOne({ email, deletedAt: null })
    if (!user) return res.status(400).json({ message: 'This code is invalid or has expired' })
    await verifyOtp({ email, purpose: 'reset', code: req.body.otp })

    user.password = req.body.password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save()
    sendToken(user, 200, res)
}

// GET /me
exports.getUserProfile = async (req, res) => {
    res.status(200).json({ success: true, user: req.user })
}

// PUT /me/update  multipart: { name, email, avatar? (file) }
exports.updateProfile = async (req, res) => {
    const error = validate(req.body, { name: 'name', email: 'email' }, ['name', 'email'])
    if (error) return res.status(400).json({ message: error })

    const { name } = req.body
    const user = await User.findById(req.user._id)

    if (req.body.email) {
        const email = normalizeEmail(req.body.email)
        if (email !== user.email) {
            if (await User.findOne({ email })) {
                return res.status(400).json({ message: 'That email is already used by another account' })
            }
            user.email = email
        }
    }
    if (name) user.name = name.trim()

    const saved = await saveAvatar(req.file)
    const oldAvatarId = user.avatar && user.avatar.public_id
    if (saved) user.avatar = saved

    try {
        await user.save({ validateBeforeSave: true })
    } catch (err) {
        if (saved) await destroyImage(saved.public_id)
        throw err
    }
    // Remove the previous photo from Cloudinary only after the new one is saved.
    if (saved) await destroyImage(oldAvatarId)

    res.status(200).json({ success: true, user })
}

// PUT /password/update  { oldPassword, password, otp }
exports.updatePassword = async (req, res) => {
    const user = await User.findById(req.user._id).select('+password')
    if (!(await user.comparePassword(String(req.body.oldPassword || '')))) {
        return res.status(400).json({ message: 'Your current password is incorrect' })
    }
    const error = validate(req.body, { password: 'password' })
    if (error) return res.status(400).json({ message: error })
    await verifyOtp({ email: user.email, purpose: 'password', code: req.body.otp })
    user.password = req.body.password
    await user.save()
    sendToken(user, 200, res)
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

// GET /admin/users
exports.allUsers = async (req, res) => {
    const users = await User.find({ deletedAt: null }).sort({ createdAt: -1 })
    res.status(200).json({ success: true, users })
}

// GET /admin/user/:id
exports.getUserDetails = async (req, res) => {
    const user = await User.findOne({ _id: req.params.id, deletedAt: null })
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.status(200).json({ success: true, user })
}

// PUT /admin/user/:id  { name, email, role }
exports.updateUser = async (req, res) => {
    const { name, email, role } = req.body
    if (role && !['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Role must be user or admin' })
    }
    if (req.params.id === req.user._id.toString() && role === 'user') {
        return res.status(400).json({ message: "You can't remove your own admin role" })
    }

    const error = validate(req.body, { name: 'name', email: 'email' }, ['name', 'email'])
    if (error) return res.status(400).json({ message: error })

    const user = await User.findOne({ _id: req.params.id, deletedAt: null })
    if (!user) return res.status(404).json({ message: 'User not found' })

    if (email && normalizeEmail(email) !== user.email) {
        if (await User.findOne({ email: normalizeEmail(email) })) {
            return res.status(400).json({ message: 'That email is already used by another account' })
        }
        user.email = normalizeEmail(email)
    }
    if (name) user.name = String(name).trim()
    if (role) user.role = role

    await user.save()
    res.status(200).json({ success: true, user })
}

// DELETE /admin/user/:id
exports.deleteUser = async (req, res) => {
    if (req.params.id === req.user._id.toString()) {
        return res.status(400).json({ message: "You can't delete your own account" })
    }
    // Soft delete: the account is blocked from logging in but kept, so Admin → Trash can restore it.
    const user = await User.findOneAndUpdate(
        { _id: req.params.id, deletedAt: null },
        { deletedAt: new Date() }
    )
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.status(200).json({ success: true, message: 'User moved to Trash' })
}
