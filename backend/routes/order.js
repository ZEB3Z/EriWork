const express = require('express')
const router = express.Router()
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')
const o = require('../controllers/order')

const admin = [isAuthenticatedUser, authorizeRoles('admin')]

// Customers
router.post('/order/new', isAuthenticatedUser, o.newOrder)
router.get('/orders/me', isAuthenticatedUser, o.myOrders)
router.get('/order/:id', isAuthenticatedUser, o.getSingleOrder)

// Admin
router.get('/admin/orders', admin, o.allOrders)
router.put('/admin/order/:id', admin, o.updateOrder)
router.delete('/admin/order/:id', admin, o.deleteOrder)
router.get('/admin/sales', admin, o.getSalesChart)
router.get('/admin/stats', admin, o.getDashboardStats)

module.exports = router
