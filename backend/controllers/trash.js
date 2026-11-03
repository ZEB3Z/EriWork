const Product = require('../models/product')
const User = require('../models/user')
const Order = require('../models/order')
const { destroyImages, destroyImage } = require('../config/cloudinary')

// Admin → Trash. Deleting a product, user, order or review in the admin panel
// only stamps it with `deletedAt` (a "soft delete"). Everything here lists those
// items, restores them (clears deletedAt) or removes them for good.

const TYPES = ['products', 'users', 'orders', 'reviews']

const badType = (res) => res.status(400).json({ message: 'Unknown trash type' })

// GET /admin/trash — everything currently in the Trash, newest deletion first
exports.getTrash = async (req, res) => {
    const [products, users, orders, reviewProducts] = await Promise.all([
        Product.find({ deletedAt: { $ne: null } }).select('-reviews').sort({ deletedAt: -1 }),
        User.find({ deletedAt: { $ne: null } }).sort({ deletedAt: -1 }),
        Order.find({ deletedAt: { $ne: null } }).populate('user', 'name email').sort({ deletedAt: -1 }),
        Product.find({ 'reviews.deletedAt': { $ne: null } }).select('name deletedAt reviews')
    ])

    const reviews = []
    reviewProducts.forEach((p) => {
        p.reviews.filter((r) => r.deletedAt).forEach((r) => {
            reviews.push({
                _id: r._id,
                productId: p._id,
                productName: p.name,
                productDeleted: Boolean(p.deletedAt),
                name: r.name,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.createdAt,
                deletedAt: r.deletedAt
            })
        })
    })
    reviews.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt))

    res.status(200).json({
        success: true,
        products,
        users,
        orders,
        reviews,
        counts: { products: products.length, users: users.length, orders: orders.length, reviews: reviews.length }
    })
}

// PUT /admin/trash/:type/:id/restore
exports.restoreItem = async (req, res) => {
    const { type, id } = req.params
    if (!TYPES.includes(type)) return badType(res)

    if (type === 'reviews') {
        const product = await Product.findOne({ 'reviews._id': id })
        if (!product) return res.status(404).json({ message: 'Review not found' })
        if (product.deletedAt) {
            return res.status(400).json({ message: 'This review belongs to a deleted product. Restore the product first.' })
        }
        const review = product.reviews.id(id)
        if (!review.deletedAt) return res.status(400).json({ message: 'This review is not in the Trash' })

        // One review per customer per product: don't bring back a second one.
        const hasNewer = product.reviews.some(
            (r) => !r.deletedAt && r.user.toString() === review.user.toString()
        )
        if (hasNewer) {
            return res.status(400).json({ message: `${review.name} has already written a newer review of this product` })
        }
        review.deletedAt = null
        product.updateRatings()
        await product.save({ validateBeforeSave: false })
        return res.status(200).json({ success: true, message: 'Review restored' })
    }

    const Model = { products: Product, users: User, orders: Order }[type]
    const item = await Model.findOneAndUpdate(
        { _id: id, deletedAt: { $ne: null } },
        { deletedAt: null }
    )
    if (!item) return res.status(404).json({ message: 'Item not found in the Trash' })
    res.status(200).json({ success: true, message: `${type.slice(0, -1)[0].toUpperCase()}${type.slice(1, -1)} restored` })
}

// DELETE /admin/trash/:type/:id — remove it for good (cannot be undone)
exports.deleteForever = async (req, res) => {
    const { type, id } = req.params
    if (!TYPES.includes(type)) return badType(res)

    if (type === 'reviews') {
        const product = await Product.findOne({ 'reviews._id': id })
        const review = product && product.reviews.id(id)
        if (!review || !review.deletedAt) return res.status(404).json({ message: 'Review not found in the Trash' })
        review.deleteOne()
        product.updateRatings()
        await product.save({ validateBeforeSave: false })
        return res.status(200).json({ success: true, message: 'Review deleted forever' })
    }

    if (type === 'products') {
        const product = await Product.findOneAndDelete({ _id: id, deletedAt: { $ne: null } })
        if (!product) return res.status(404).json({ message: 'Product not found in the Trash' })
        await destroyImages(product.images)
    } else if (type === 'users') {
        const user = await User.findOneAndDelete({ _id: id, deletedAt: { $ne: null } })
        if (!user) return res.status(404).json({ message: 'User not found in the Trash' })
        await destroyImage(user.avatar && user.avatar.public_id)
    } else {
        const order = await Order.findOneAndDelete({ _id: id, deletedAt: { $ne: null } })
        if (!order) return res.status(404).json({ message: 'Order not found in the Trash' })
    }
    res.status(200).json({ success: true, message: 'Deleted forever' })
}
