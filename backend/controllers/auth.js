const crypto = require('crypto')
const User = require('../models/user')
const localStorage = require('../utils/localStorage')
const sendEmail = require('../utils/sendEmail')
const { verifyFirebaseToken, firebaseConfigured } = require('../utils/firebase')

const DEFAULT_AVATAR = { public_id: 'avatars/placeholder', url: '/uploads/avatars/placeholder.png' }
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// Send back the user + a fresh JWT.
const sendToken = (user, statusCode, res) => {
    const token = user.getJwtToken()
    res.status(statusCode).json({ success: true, token, user })
}

// Saves a base64 avatar if one was sent, otherwise returns null.
const saveAvatar = (avatar) =>
    avatar && avatar.startsWith('data:image') ? localStorage.saveDataUri(avatar, 'avatars') : null

// POST /register  { name, email, password, avatar? }
exports.registerUser = async (req, res) => {
    const { name, email, password, avatar } = req.body
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please enter name, email and password' })
    }
    if (await User.findOne({ email: email.toLowerCase() })) {
        return res.status(400).json({ message: 'An account with this email already exists' })
    }

    const saved = saveAvatar(avatar)
    const user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        avatar: saved ? { public_id: saved.public_id, url: saved.url } : DEFAULT_AVATAR
    })
    sendToken(user, 201, res)
}

// POST /login  { email, password }
exports.loginUser = async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter email and password' })
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' })
    }
    sendToken(user, 200, res)
}

// POST /login/google  { idToken } — Google sign-in through Firebase
exports.googleLogin = async (req, res) => {
    if (!firebaseConfigured()) {
        return res.status(503).json({ message: 'Google sign-in is not configured on the server (FIREBASE_PROJECT_ID missing)' })
    }

    let decoded
    try {
        decoded = await verifyFirebaseToken(req.body.idToken)
    } catch (err) {
        return res.status(401).json({ message: 'Google sign-in failed. Please try again.' })
    }
    if (!decoded.email) {
        return res.status(400).json({ message: 'Your Google account has no email address' })
    }

    // Log in the existing account, or create one the first time.
    let user = await User.findOne({ email: decoded.email.toLowerCase() })
    if (!user) {
        user = await User.create({
            name: (decoded.name || decoded.email.split('@')[0]).slice(0, 30),
            email: decoded.email.toLowerCase(),
            password: crypto.randomBytes(24).toString('hex'), // never used; they sign in with Google
            avatar: decoded.picture
                ? { public_id: 'avatars/google', url: decoded.picture }
                : DEFAULT_AVATAR
        })
    }
    sendToken(user, 200, res)
}

// POST /password/forgot  { email }
exports.forgotPassword = async (req, res) => {
    const user = await User.findOne({ email: (req.body.email || '').toLowerCase() })
    if (!user) {
        return res.status(404).json({ message: 'No account found with this email' })
    }

    const resetToken = user.getResetPasswordToken()
    await user.save({ validateBeforeSave: false })

    const resetUrl = `${FRONTEND_URL}/password/reset/${resetToken}`
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
        res.status(500).json({ message: 'Could not send the email. Check the SMTP settings in backend/config/.env' })
    }
}

// PUT /password/reset/:token  { password, confirmPassword }
exports.resetPassword = async (req, res) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    const user = await User.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } })
    if (!user) {
        return res.status(400).json({ message: 'This reset link is invalid or has expired' })
    }
    if (!req.body.password || req.body.password !== req.body.confirmPassword) {
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

// PUT /me/update  { name, email, avatar? }
exports.updateProfile = async (req, res) => {
    const { name, email, avatar } = req.body
    const user = await User.findById(req.user._id)

    if (email && email.toLowerCase() !== user.email) {
        if (await User.findOne({ email: email.toLowerCase() })) {
            return res.status(400).json({ message: 'That email is already used by another account' })
        }
        user.email = email.toLowerCase()
    }
    if (name) user.name = name

    const saved = saveAvatar(avatar)
    if (saved) {
        localStorage.destroy(user.avatar && user.avatar.public_id)
        user.avatar = { public_id: saved.public_id, url: saved.url }
    }

    await user.save({ validateBeforeSave: true })
    res.status(200).json({ success: true, user })
}

// PUT /password/update  { oldPassword, password }
exports.updatePassword = async (req, res) => {
    const user = await User.findById(req.user._id).select('+password')
    if (!(await user.comparePassword(req.body.oldPassword || ''))) {
        return res.status(400).json({ message: 'Your current password is incorrect' })
    }
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

    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    if (email && email.toLowerCase() !== user.email) {
        if (await User.findOne({ email: email.toLowerCase() })) {
            return res.status(400).json({ message: 'That email is already used by another account' })
        }
        user.email = email.toLowerCase()
    }
    if (name) user.name = name
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
    localStorage.destroy(user.avatar && user.avatar.public_id)
    res.status(200).json({ success: true })
}
