const Product = require('../models/product')
const { CATEGORIES } = require('../models/product')
const Order = require('../models/order')
const { uploadFiles, destroyImages } = require('../config/cloudinary')
const { cleanText } = require('../utils/badWords')
const { validate } = require('../utils/validate')

// Make user text safe to use inside a regular expression.
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Only these fields can be set from the admin form.
const pickProductFields = (body) => ({
    name: String(body.name).trim(),
    price: Number(body.price),
    description: String(body.description).trim(),
    category: body.category,
    seller: String(body.seller).trim(),
    stock: Number(body.stock)
})

const PRODUCT_RULES = {
    name: 'productName',
    price: 'price',
    description: 'description',
    category: 'category',
    seller: 'seller',
    stock: 'stock'
}

// keepImages arrives from a multipart form as a JSON string: '["eriwork/products/abc", ...]'
const parseKeepImages = (value) => {
    if (Array.isArray(value)) return value.map(String)
    if (typeof value !== 'string' || !value) return []
    try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
        return [value]
    }
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

// GET /products?keyword=&category=&minPrice=&maxPrice=&ratings=&page=&limit=
exports.getProducts = async (req, res) => {
    const { keyword, category, minPrice, maxPrice, ratings } = req.query
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 8))

    const filter = {}
    if (keyword) filter.name = { $regex: escapeRegex(keyword), $options: 'i' }
    if (category) filter.category = category
    if (minPrice || maxPrice) {
        filter.price = {}
        if (minPrice) filter.price.$gte = Number(minPrice)
        if (maxPrice) filter.price.$lte = Number(maxPrice)
    }
    if (ratings) filter.ratings = { $gte: Number(ratings) }

    const total = await Product.countDocuments(filter)
    const products = await Product.find(filter)
        .select('-reviews')
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)

    res.status(200).json({
        success: true,
        products,
        total,
        page,
        hasMore: page * limit < total
    })
}

// GET /products/meta — price bounds and categories for the filter panel
exports.getProductsMeta = async (req, res) => {
    const cheapest = await Product.findOne().sort({ price: 1 }).select('price')
    const priciest = await Product.findOne().sort({ price: -1 }).select('price')
    res.status(200).json({
        success: true,
        categories: CATEGORIES,
        minPrice: cheapest ? Math.floor(cheapest.price) : 0,
        maxPrice: priciest ? Math.ceil(priciest.price) : 1000
    })
}

// GET /product/:id
exports.getSingleProduct = async (req, res) => {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.status(200).json({ success: true, product })
}

// ---------------------------------------------------------------------------
// Reviews (logged-in users)
// ---------------------------------------------------------------------------

const hasPurchased = (userId, productId) =>
    Order.exists({
        user: userId,
        'orderItems.product': productId,
        orderStatus: { $ne: 'Cancelled' }
    })

// GET /review/eligibility/:productId — can this user review, plus their existing review
exports.getReviewEligibility = async (req, res) => {
    const product = await Product.findById(req.params.productId)
    if (!product) return res.status(404).json({ message: 'Product not found' })

    const purchased = await hasPurchased(req.user._id, product._id)
    const myReview = product.reviews.find((r) => r.user.toString() === req.user._id.toString())

    res.status(200).json({ success: true, canReview: Boolean(purchased), review: myReview || null })
}

// PUT /review  { productId, rating, comment } — create or update the user's own review
exports.createProductReview = async (req, res) => {
    const { productId, comment } = req.body
    const rating = Number(req.body.rating)

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' })
    }
    if (!comment || !String(comment).trim()) {
        return res.status(400).json({ message: 'Please write a comment' })
    }
    const error = validate(req.body, { productId: 'mongoId', comment: 'reviewComment' })
    if (error) return res.status(400).json({ message: error })

    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ message: 'Product not found' })

    if (!(await hasPurchased(req.user._id, product._id))) {
        return res.status(403).json({ message: 'You can only review products you have purchased' })
    }

    const cleanComment = cleanText(String(comment).trim())
    const existing = product.reviews.find((r) => r.user.toString() === req.user._id.toString())

    if (existing) {
        existing.rating = rating
        existing.comment = cleanComment
        existing.createdAt = Date.now()
    } else {
        product.reviews.push({
            user: req.user._id,
            name: req.user.name,
            rating,
            comment: cleanComment
        })
    }

    product.updateRatings()
    await product.save({ validateBeforeSave: false })

    res.status(200).json({
        success: true,
        message: existing ? 'Review updated' : 'Review posted'
    })
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

// GET /admin/products
exports.getAdminProducts = async (req, res) => {
    const products = await Product.find().select('-reviews').sort({ createdAt: -1 })
    res.status(200).json({ success: true, products })
}

// POST /admin/product/new  multipart: { ...fields, images: [files] }
exports.newProduct = async (req, res) => {
    // Validate before uploading so a bad form never leaves images in Cloudinary.
    const error = validate(req.body, PRODUCT_RULES)
    if (error) return res.status(400).json({ message: error })
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Please upload at least one image' })
    }

    const images = await uploadFiles(req.files, 'products')
    try {
        const product = await Product.create({
            ...pickProductFields(req.body),
            images,
            user: req.user._id
        })
        res.status(201).json({ success: true, product })
    } catch (err) {
        await destroyImages(images)
        throw err
    }
}

// PUT /admin/product/:id  multipart: { ...fields, keepImages: '[public_id, ...]', images: [files] }
exports.updateProduct = async (req, res) => {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })

    const error = validate(req.body, PRODUCT_RULES)
    if (error) return res.status(400).json({ message: error })

    const keepIds = parseKeepImages(req.body.keepImages)
    const keptImages = product.images.filter((img) => keepIds.includes(img.public_id))
    const removedImages = product.images.filter((img) => !keepIds.includes(img.public_id))
    const files = req.files || []

    if (keptImages.length === 0 && files.length === 0) {
        return res.status(400).json({ message: 'A product needs at least one image' })
    }
    const newImages = await uploadFiles(files, 'products')

    Object.assign(product, pickProductFields(req.body))
    product.images = [...keptImages, ...newImages]
    try {
        await product.save()
    } catch (err) {
        await destroyImages(newImages)
        throw err
    }

    // Photos the admin removed are deleted from Cloudinary.
    await destroyImages(removedImages)

    res.status(200).json({ success: true, product })
}

// DELETE /admin/product/:id
exports.deleteProduct = async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })

    await destroyImages(product.images)
    res.status(200).json({ success: true, message: 'Product deleted' })
}

// POST /admin/products/bulk-delete  { ids: [...] }
exports.bulkDeleteProducts = async (req, res) => {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : []
    if (ids.length === 0) {
        return res.status(400).json({ message: 'No products selected' })
    }

    if (ids.some((id) => validate({ id }, { id: 'mongoId' }))) {
        return res.status(400).json({ message: 'Invalid product id in selection' })
    }

    const products = await Product.find({ _id: { $in: ids } })
    await Product.deleteMany({ _id: { $in: ids } })
    await Promise.all(products.map((p) => destroyImages(p.images)))

    res.status(200).json({ success: true, deletedCount: products.length })
}

// GET /admin/reviews — every review across all products (for the admin table)
exports.getAllReviews = async (req, res) => {
    const products = await Product.find({ numOfReviews: { $gt: 0 } }).select('name reviews')
    const reviews = []
    products.forEach((p) => {
        p.reviews.forEach((r) => {
            reviews.push({
                _id: r._id,
                productId: p._id,
                productName: p.name,
                name: r.name,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.createdAt
            })
        })
    })
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    res.status(200).json({ success: true, reviews })
}

// DELETE /admin/reviews?productId=...&id=...
exports.deleteReview = async (req, res) => {
    const product = await Product.findById(req.query.productId)
    if (!product) return res.status(404).json({ message: 'Product not found' })

    const before = product.reviews.length
    product.reviews = product.reviews.filter((r) => r._id.toString() !== String(req.query.id))
    if (product.reviews.length === before) {
        return res.status(404).json({ message: 'Review not found' })
    }

    product.updateRatings()
    await product.save({ validateBeforeSave: false })
    res.status(200).json({ success: true, message: 'Review deleted' })
}
