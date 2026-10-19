const express = require('express')
const router = express.Router()
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')
const a = require('../controllers/auth')

const admin = [isAuthenticatedUser, authorizeRoles('admin')]

// Account
router.post('/register', a.registerUser)
router.post('/login', a.loginUser)
router.post('/login/google', a.googleLogin)
router.post('/password/forgot', a.forgotPassword)
router.put('/password/reset/:token', a.resetPassword)

// Logged-in user
router.get('/me', isAuthenticatedUser, a.getUserProfile)
router.put('/me/update', isAuthenticatedUser, a.updateProfile)
router.put('/password/update', isAuthenticatedUser, a.updatePassword)

// Admin
router.get('/admin/users', admin, a.allUsers)
router.get('/admin/user/:id', admin, a.getUserDetails)
router.put('/admin/user/:id', admin, a.updateUser)
router.delete('/admin/user/:id', admin, a.deleteUser)

module.exports = router
