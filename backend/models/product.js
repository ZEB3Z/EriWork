const mongoose = require('mongoose')

const CATEGORIES = [
    'Routers',
    'Mesh WiFi',
    'Range Extenders',
    'Access Points',
    'Switches',
    'Network Adapters',
    'Powerline',
    'Cables',
    'Accessories'
]

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null } // set when an admin deletes it; cleared by Restore
})

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter product name'],
        trim: true,
        maxLength: [100, 'Product name cannot exceed 100 characters']
    },
    price: {
        type: Number,
        required: [true, 'Please enter product price'],
        min: [0, 'Price cannot be negative']
    },
    description: {
        type: String,
        required: [true, 'Please enter product description']
    },
    images: [
        {
            public_id: { type: String, required: true },
            url: { type: String, required: true }
        }
    ],
    category: {
        type: String,
        required: [true, 'Please select category for this product'],
        enum: { values: CATEGORIES, message: 'Please select correct category for product' }
    },
    seller: {
        type: String,
        required: [true, 'Please enter product seller']
    },
    stock: {
        type: Number,
        required: [true, 'Please enter product stock'],
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    ratings: { type: Number, default: 0 },
    numOfReviews: { type: Number, default: 0 },
    reviews: [reviewSchema],
    user: { type: mongoose.Schema.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null } // set when an admin deletes it; cleared by Restore
})

// Recalculate the average rating and review count from the reviews array.
productSchema.methods.updateRatings = function () {
    const active = this.reviews.filter((r) => !r.deletedAt) // deleted reviews don't count
    this.numOfReviews = active.length
    this.ratings = active.length
        ? active.reduce((sum, r) => sum + r.rating, 0) / active.length
        : 0
}

module.exports = mongoose.model('Product', productSchema)
module.exports.CATEGORIES = CATEGORIES
