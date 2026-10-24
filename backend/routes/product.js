const express = require('express')
const router = express.Router()
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')
const { uploadProductImages } = require('../middlewares/upload')
const p = require('../controllers/product')

const admin = [isAuthenticatedUser, authorizeRoles('admin')]

// Public
router.get('/products', p.getProducts)
router.get('/products/meta', p.getProductsMeta)
router.get('/product/:id', p.getSingleProduct)

// Reviews (logged-in users)
router.get('/review/eligibility/:productId', isAuthenticatedUser, p.getReviewEligibility)
router.put('/review', isAuthenticatedUser, p.createProductReview)

// Admin
router.get('/admin/products', admin, p.getAdminProducts)
router.post('/admin/product/new', admin, uploadProductImages, p.newProduct)
router.put('/admin/product/:id', admin, uploadProductImages, p.updateProduct)
router.delete('/admin/product/:id', admin, p.deleteProduct)
router.post('/admin/products/bulk-delete', admin, p.bulkDeleteProducts)
router.get('/admin/reviews', admin, p.getAllReviews)
router.delete('/admin/reviews', admin, p.deleteReview)

module.exports = router
