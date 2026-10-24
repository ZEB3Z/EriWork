const Order = require('../models/order')
const { ORDER_STATUSES } = require('../models/order')
const Product = require('../models/product')
const User = require('../models/user')
const { calculatePrices } = require('../utils/pricing')
const { sendOrderEmail } = require('../utils/orderNotifications')

// POST /order/new  { orderItems: [{ product, quantity }], shippingInfo }
// Names, prices and totals are taken from the database, not from the browser.
exports.newOrder = async (req, res) => {
    const { orderItems, shippingInfo } = req.body
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        return res.status(400).json({ message: 'Your cart is empty' })
    }

    // 1. Validate every item and check stock before changing anything.
    const items = []
    for (const item of orderItems) {
        const product = await Product.findById(item.product)
        if (!product) {
            return res.status(404).json({ message: 'A product in your cart no longer exists' })
        }
        const quantity = Math.max(1, Number(item.quantity) || 1)
        if (product.stock < quantity) {
            return res.status(400).json({ message: `Only ${product.stock} left in stock for "${product.name}"` })
        }
        items.push({
            product: product._id,
            name: product.name,
            price: product.price,
            quantity,
            image: product.images[0] ? product.images[0].url : 'placeholder'
        })
    }

    // 2. Create the order with server-calculated totals.
    const order = await Order.create({
        orderItems: items,
        shippingInfo,
        ...calculatePrices(items),
        paymentInfo: { id: 'mock_' + Date.now(), status: 'succeeded' },
        paidAt: Date.now(),
        user: req.user._id
    })

    // 3. Reserve stock.
    for (const item of items) {
        await Product.updateOne({ _id: item.product }, { $inc: { stock: -item.quantity } })
    }

    // 4. Email confirmation + PDF receipt (runs in the background, never fails the order).
    sendOrderEmail(order, req.user, 'placed')

    res.status(201).json({ success: true, order })
}

// GET /orders/me
exports.myOrders = async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.status(200).json({ success: true, orders })
}

// GET /order/:id — the owner or an admin can view it
exports.getSingleOrder = async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email')
    if (!order) return res.status(404).json({ message: 'Order not found' })

    const isOwner = order.user && order.user._id.toString() === req.user._id.toString()
    if (!isOwner && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'You cannot view this order' })
    }
    res.status(200).json({ success: true, order })
}

// GET /admin/orders
exports.allOrders = async (req, res) => {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 })
    const totalAmount = orders
        .filter((o) => o.orderStatus !== 'Cancelled')
        .reduce((sum, o) => sum + o.totalPrice, 0)
    res.status(200).json({ success: true, totalAmount, orders })
}

// PUT /admin/order/:id  { status } — update status and email the customer
exports.updateOrder = async (req, res) => {
    const { status } = req.body
    if (!ORDER_STATUSES.includes(status)) {
        return res.status(400).json({ message: 'Invalid order status' })
    }

    const order = await Order.findById(req.params.id).populate('user', 'name email')
    if (!order) return res.status(404).json({ message: 'Order not found' })

    if (order.orderStatus === 'Delivered' || order.orderStatus === 'Cancelled') {
        return res.status(400).json({ message: `This order is already ${order.orderStatus.toLowerCase()} and can't be changed` })
    }
    if (order.orderStatus === status) {
        return res.status(400).json({ message: `Order is already ${status}` })
    }

    // Cancelling gives the reserved stock back.
    if (status === 'Cancelled') {
        for (const item of order.orderItems) {
            await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } })
        }
    }
    if (status === 'Delivered') order.deliveredAt = Date.now()

    order.orderStatus = status
    await order.save()

    const emailed = await sendOrderEmail(order, order.user, 'status')

    res.status(200).json({
        success: true,
        order,
        emailed,
        message: emailed
            ? `Order marked ${status}. Customer was emailed with the receipt.`
            : `Order marked ${status}. (Email not sent — check SMTP settings.)`
    })
}

// DELETE /admin/order/:id
exports.deleteOrder = async (req, res) => {
    const order = await Order.findByIdAndDelete(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found' })
    res.status(200).json({ success: true })
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

// "2026-10-15" for a date, using the server's local time zone.
const toDayKey = (date) => {
    const d = new Date(date)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${mm}-${dd}`
}

// GET /admin/sales?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// Returns one entry per day in the range: { date, total, orders }.
exports.getSalesChart = async (req, res) => {
    const { startDate, endDate } = req.query
    const start = new Date(`${startDate}T00:00:00`)
    const end = new Date(`${endDate}T23:59:59.999`)

    if (isNaN(start) || isNaN(end)) {
        return res.status(400).json({ message: 'Please provide a valid start and end date' })
    }
    if (start > end) {
        return res.status(400).json({ message: 'Start date must be before end date' })
    }
    if ((end - start) / 86400000 > 366) {
        return res.status(400).json({ message: 'Please choose a range of one year or less' })
    }

    const orders = await Order.find({
        paidAt: { $gte: start, $lte: end },
        orderStatus: { $ne: 'Cancelled' }
    }).select('paidAt totalPrice')

    // Start every day at zero so the chart has no gaps.
    const byDay = {}
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        byDay[toDayKey(d)] = { date: toDayKey(d), total: 0, orders: 0 }
    }
    orders.forEach((o) => {
        const day = byDay[toDayKey(o.paidAt)]
        if (day) {
            day.total += o.totalPrice
            day.orders += 1
        }
    })

    const sales = Object.values(byDay).map((d) => ({ ...d, total: Math.round(d.total * 100) / 100 }))
    const totalSales = sales.reduce((sum, d) => sum + d.total, 0)

    res.status(200).json({
        success: true,
        sales,
        totalSales: Math.round(totalSales * 100) / 100,
        totalOrders: orders.length
    })
}

// GET /admin/stats — numbers for the dashboard cards
exports.getDashboardStats = async (req, res) => {
    const [products, outOfStock, users, orders] = await Promise.all([
        Product.countDocuments(),
        Product.countDocuments({ stock: 0 }),
        User.countDocuments(),
        Order.find().select('totalPrice orderStatus')
    ])

    const statusCounts = {}
    ORDER_STATUSES.forEach((s) => { statusCounts[s] = 0 })
    orders.forEach((o) => { statusCounts[o.orderStatus] = (statusCounts[o.orderStatus] || 0) + 1 })

    const totalSales = orders
        .filter((o) => o.orderStatus !== 'Cancelled')
        .reduce((sum, o) => sum + o.totalPrice, 0)

    res.status(200).json({
        success: true,
        stats: {
            products,
            outOfStock,
            users,
            orders: orders.length,
            totalSales: Math.round(totalSales * 100) / 100,
            statusCounts
        }
    })
}
