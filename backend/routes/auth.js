const express = require('express')
const router = express.Router()
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')
const { uploadAvatar } = require('../middlewares/upload')
const a = require('../controllers/auth')

const admin = [isAuthenticatedUser, authorizeRoles('admin')]

// Account
router.post('/register/otp', a.requestRegisterOtp)   // step 1: email a code
router.post('/register', uploadAvatar, a.registerUser) // step 2: code + details create the account
router.post('/login', a.loginUser)                     // step 1: password ok -> email a code
router.post('/login/verify', a.verifyLogin)            // step 2: code logs you in
router.get('/logout', a.logoutUser)
router.post('/login/social', a.socialLogin)  // Google or Facebook (Firebase ID token)
router.post('/login/google', a.socialLogin)  // kept for older clients
router.post('/password/forgot', a.forgotPassword)
router.put('/password/reset', a.resetPassword)

// Logged-in user
router.get('/me', isAuthenticatedUser, a.getUserProfile)
router.put('/me/update', isAuthenticatedUser, uploadAvatar, a.updateProfile)
router.post('/otp/send', isAuthenticatedUser, a.sendActionOtp)
router.put('/password/update', isAuthenticatedUser, a.updatePassword)

// Admin
router.get('/admin/users', admin, a.allUsers)
router.get('/admin/user/:id', admin, a.getUserDetails)
router.put('/admin/user/:id', admin, a.updateUser)
router.delete('/admin/user/:id', admin, a.deleteUser)

module.exports = router
