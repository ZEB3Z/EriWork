const express = require('express')
const router = express.Router()
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')
const t = require('../controllers/trash')

const admin = [isAuthenticatedUser, authorizeRoles('admin')]

// Admin only: see what was deleted, bring it back, or remove it for good.
// :type is products, users, orders or reviews.
router.get('/admin/trash', admin, t.getTrash)
router.put('/admin/trash/:type/:id/restore', admin, t.restoreItem)
router.delete('/admin/trash/:type/:id', admin, t.deleteForever)

module.exports = router
