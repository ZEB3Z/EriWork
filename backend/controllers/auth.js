const crypto = require('crypto')
const User = require('../models/user')
const { DEFAULT_AVATAR } = require('../models/user')
const { uploadBuffer, destroyImage } = require('../config/cloudinary')
const sendEmail = require('../utils/sendEmail')
const { validate, normalizeEmail } = require('../utils/validate')
const { verifyFirebaseToken, firebaseConfigured, SOCIAL_PROVIDERS } = require('../utils/firebase')

const frontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '')

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

// POST /register  multipart: { name, email, password, avatar? (file) }
exports.registerUser = async (req, res) => {
    const { name, password } = req.body
    const error = validate(req.body, { name: 'name', email: 'email', password: 'password' })
    if (error) return res.status(400).json({ message: error })

    const email = normalizeEmail(req.body.email)
    if (await User.findOne({ email })) {
        return res.status(400).json({ message: 'An account with this email already exists' })
    }

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

// POST /login  { email, password }
exports.loginUser = async (req, res) => {
    const { password } = req.body
    if (!req.body.email || !password) {
        return res.status(400).json({ message: 'Please enter email and password' })
    }
    const error = validate(req.body, { email: 'email' })
    if (error) return res.status(400).json({ message: error })

    const user = await User.findOne({ email: normalizeEmail(req.body.email) }).select('+password')
    if (!user || !(await user.comparePassword(String(password)))) {
        return res.status(401).json({ message: 'Invalid email or password' })
    }
    sendToken(user, 200, res)
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

// POST /password/forgot  { email }
exports.forgotPassword = async (req, res) => {
    const error = validate(req.body, { email: 'email' })
    if (error) return res.status(400).json({ message: error })

    const user = await User.findOne({ email: normalizeEmail(req.body.email) })
    if (!user) {
        return res.status(404).json({ message: 'No account found with this email' })
    }

    const resetToken = user.getResetPasswordToken()
    await user.save({ validateBeforeSave: false })

    const resetUrl = `${frontendUrl()}/password/reset/${resetToken}`
    console.log('Password reset link for', user.email, '=>', resetUrl)

    try {
        await sendEmail({
            email: user.email,
            subject: 'EriWork — Reset your password',
            message: `Hi ${user.name},\n\nReset your password using this link (valid for 30 minutes):\n${resetUrl}\n\nIf you didn't ask for this, you can ignore this email.`,
            html: `
<div style="background:#f5f7fb;padding:32px 12px;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e3e8f0;border-radius:12px;overflow:hidden;">
    <div style="background:#0f766e;padding:22px 26px;font-size:22px;font-weight:800;color:#fff;">EriWork</div>
    <div style="padding:26px;color:#1f2a37;font-size:14px;line-height:1.6;">
      <p style="margin:0 0 12px;font-size:16px;color:#0f1b2d;">Hi ${user.name},</p>
      <p style="margin:0 0 20px;">We received a request to reset your password. This link is valid for 30 minutes.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:700;">Reset password</a>
      <p style="margin:20px 0 0;color:#64748b;font-size:13px;">If you didn't ask for this, you can safely ignore this email.</p>
    </div>
  </div>
</div>`
        })
        res.status(200).json({ success: true, message: `Reset link sent to ${user.email}` })
    } catch (error) {
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined
        await user.save({ validateBeforeSave: false })
        res.status(500).json({ message: 'Could not send the email. Check the SMTP settings in backend/.env' })
    }
}

// PUT /password/reset/:token  { password, confirmPassword }
exports.resetPassword = async (req, res) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    const user = await User.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } })
    if (!user) {
        return res.status(400).json({ message: 'This reset link is invalid or has expired' })
    }
    const error = validate(req.body, { password: 'password' })
    if (error) return res.status(400).json({ message: error })
    if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' })
    }

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

// PUT /password/update  { oldPassword, password }
exports.updatePassword = async (req, res) => {
    const user = await User.findById(req.user._id).select('+password')
    if (!(await user.comparePassword(String(req.body.oldPassword || '')))) {
        return res.status(400).json({ message: 'Your current password is incorrect' })
    }
    const error = validate(req.body, { password: 'password' })
    if (error) return res.status(400).json({ message: error })
    user.password = req.body.password
    await user.save()
    sendToken(user, 200, res)
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

// GET /admin/users
exports.allUsers = async (req, res) => {
    const users = await User.find().sort({ createdAt: -1 })
    res.status(200).json({ success: true, users })
}

// GET /admin/user/:id
exports.getUserDetails = async (req, res) => {
    const user = await User.findById(req.params.id)
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

    const user = await User.findById(req.params.id)
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
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    await user.deleteOne()
    await destroyImage(user.avatar && user.avatar.public_id)
    res.status(200).json({ success: true })
}
