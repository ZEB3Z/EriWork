// One-time setup script for EriWork. Run from the backend/ folder:
//   node seeds/seed.js
//
// Creates (only if missing, so it's safe to run again):
//   - an admin account          admin@eriwork.local    / admin1234
//   - two demo customers        juan@eriwork.local     / customer1234
//                               maria@eriwork.local    / customer1234
//   - a catalog of networking products with photos
//   - demo orders over the last 60 days (for the sales chart) and reviews
//
// To start completely fresh, delete the database in MongoDB Compass first.

const path = require('path')
const mongoose = require('mongoose')
require('dotenv').config({ path: path.join(__dirname, '..', 'config', '.env') })

const Product = require('../models/product')
const Order = require('../models/order')
const User = require('../models/user')
const { calculatePrices } = require('../utils/pricing')
const { cleanText } = require('../utils/badWords')

const img = (name) => [
    { public_id: `products/seed/${name}-a`, url: `/uploads/products/seed/${name}-a.svg` },
    { public_id: `products/seed/${name}-b`, url: `/uploads/products/seed/${name}-b.svg` }
]

const PRODUCTS = [
    { name: 'EriWork AX3000 Dual-Band WiFi 6 Router', price: 89.99, category: 'Routers', stock: 40, images: img('router'),
      description: 'Wi-Fi 6 router with speeds up to 3000 Mbps, four high-gain antennas, OFDMA and MU-MIMO for low-latency connections across many devices. Four Gigabit LAN ports and one Gigabit WAN port.' },
    { name: 'EriWork AX5400 Tri-Band Gaming Router', price: 169.99, category: 'Routers', stock: 25, images: img('gaming-router'),
      description: 'Tri-band Wi-Fi 6 gaming router with a 1.7 GHz quad-core CPU, a dedicated gaming port, traffic prioritisation and 2.5G WAN. Built for low ping under heavy load.' },
    { name: 'EriWork Deco Mesh WiFi System (3-Pack)', price: 199.99, category: 'Mesh WiFi', stock: 30, images: img('mesh'),
      description: 'Whole-home mesh Wi-Fi covering up to 5,500 sq ft with seamless roaming on one network name. Self-healing mesh, parental controls and app setup in minutes.' },
    { name: 'EriWork AC1200 WiFi Range Extender', price: 34.99, category: 'Range Extenders', stock: 60, images: img('extender'),
      description: 'Dual-band extender that boosts existing Wi-Fi coverage by up to 1,500 sq ft. One-touch setup, a signal indicator for the best placement and a Gigabit Ethernet port.' },
    { name: 'EriWork Ceiling Mount WiFi 6 Access Point', price: 79.99, category: 'Access Points', stock: 35, images: img('access-point'),
      description: 'Business-grade Wi-Fi 6 access point with PoE power, seamless roaming and cloud management. Ideal for offices, cafes and classrooms.' },
    { name: 'EriWork 8-Port Gigabit Desktop Switch', price: 24.99, category: 'Switches', stock: 80, images: img('switch-8'),
      description: 'Unmanaged 8-port Gigabit switch in a fanless metal case. Plug-and-play setup with auto-negotiation on every port.' },
    { name: 'EriWork 16-Port Gigabit Smart Switch', price: 109.99, category: 'Switches', stock: 20, images: img('switch-16'),
      description: 'Smart managed 16-port Gigabit switch with VLAN, QoS and link aggregation in a 1U rack-mount chassis. Web-managed for growing networks.' },
    { name: 'EriWork USB 3.0 Gigabit Ethernet Adapter', price: 15.99, category: 'Network Adapters', stock: 100, images: img('usb-adapter'),
      description: 'Adds a Gigabit wired port to any laptop over USB 3.0. Plug-and-play on Windows, macOS and Linux.' },
    { name: 'EriWork AV1000 Powerline Adapter Kit', price: 44.99, category: 'Powerline', stock: 45, images: img('powerline'),
      description: 'Extends your network through existing electrical wiring at up to 1000 Mbps — no new cables needed. Plug-and-play pair with Gigabit ports.' },
    { name: 'EriWork Cat6 Ethernet Cable 3m (5-Pack)', price: 12.99, category: 'Cables', stock: 150, images: img('cable-cat6'),
      description: 'Cat6 patch cables rated for Gigabit speeds and 250 MHz bandwidth, with snagless boots and pure copper conductors. Pack of five.' },
    { name: 'EriWork Cat7 Shielded Ethernet Cable 10m', price: 18.99, category: 'Cables', stock: 90, images: img('cable-cat7'),
      description: 'Shielded S/FTP Cat7 cable supporting 10 Gbps for interference-free high-speed runs. Durable braided jacket and gold-plated connectors.' },
    { name: 'EriWork 24-Port Cat6 Patch Panel', price: 29.99, category: 'Accessories', stock: 0, images: img('patch-panel'),
      description: '24-port Cat6 patch panel for tidy structured cabling. Colour-coded T568A/B wiring and wall or rack mounting.' }
]

const CUSTOMERS = [
    { name: 'Juan Dela Cruz', email: 'juan@eriwork.local', city: 'Taguig', address: '123 Rizal Avenue', postalCode: '1630' },
    { name: 'Maria Santos', email: 'maria@eriwork.local', city: 'Quezon City', address: '45 Katipunan Road', postalCode: '1108' }
]

// [customer index, product index, rating, comment] — the last one shows the bad-words filter in action
const REVIEWS = [
    [0, 0, 5, 'Strong signal in every room. Setup took ten minutes.'],
    [1, 0, 4, 'Fast and stable. The app could be a little simpler.'],
    [0, 2, 5, 'No more dead zones upstairs. Worth every peso.'],
    [1, 2, 4, 'Great coverage, but the units are bigger than I expected.'],
    [0, 5, 4, 'Does exactly what it should. Silent and cool.'],
    [1, 9, 3, 'Cables are fine, one connector was a bit loose.'],
    [0, 3, 2, 'Setup was a damn pain and speeds dropped at night.'],
    [1, 7, 5, 'Plug in and it just works on my laptop.']
]

// Small deterministic random generator so every seed produces the same demo data.
let seed = 42
const random = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
}

async function ensureUser(data) {
    const existing = await User.findOne({ email: data.email })
    if (existing) {
        console.log(`User ${data.email} already exists, skipping.`)
        return existing
    }
    const user = await User.create({
        ...data,
        avatar: { public_id: 'avatars/placeholder', url: '/uploads/avatars/placeholder.png' }
    })
    console.log(`Created ${data.role || 'user'}: ${data.email} / ${data.password}`)
    return user
}

async function run() {
    await mongoose.connect(process.env.DB_URI)
    console.log('Connected to MongoDB for seeding...\n')

    // ---- Users ----
    const admin = await ensureUser({ name: 'EriWork Admin', email: 'admin@eriwork.local', password: 'admin1234', role: 'admin' })
    const customers = []
    for (const c of CUSTOMERS) {
        customers.push(await ensureUser({ name: c.name, email: c.email, password: 'customer1234' }))
    }

    // ---- Products ----
    let products = await Product.find().sort({ createdAt: -1 })
    if (products.length > 0) {
        console.log(`\nProducts already exist (${products.length}), skipping catalog.`)
    } else {
        console.log('')
        const now = Date.now()
        for (let i = 0; i < PRODUCTS.length; i++) {
            // Spread createdAt so "newest first" ordering is stable.
            await Product.create({ ...PRODUCTS[i], seller: 'EriWork', user: admin._id, createdAt: new Date(now - i * 60000) })
            console.log(`Created product "${PRODUCTS[i].name}"`)
        }
        products = await Product.find().sort({ createdAt: -1 })
    }

    // ---- Demo orders + reviews (only on a fresh database) ----
    if (await Order.countDocuments() > 0) {
        console.log('\nOrders already exist, skipping demo orders and reviews.')
    } else {
        // Orders spread over the last 60 days so the sales chart has data.
        const statuses = ['Delivered', 'Delivered', 'Delivered', 'Shipped', 'Processing']
        let created = 0
        for (let daysAgo = 59; daysAgo >= 0; daysAgo--) {
            if (random() < 0.45) continue // not every day has sales
            const ci = Math.floor(random() * customers.length)
            const items = []
            const count = 1 + Math.floor(random() * 3)
            for (let k = 0; k < count; k++) {
                const p = products[Math.floor(random() * (products.length - 1))] // skip out-of-stock patch panel
                if (items.find((it) => String(it.product) === String(p._id))) continue
                items.push({ product: p._id, name: p.name, price: p.price, quantity: 1 + Math.floor(random() * 2), image: p.images[0].url })
            }
            const date = new Date(Date.now() - daysAgo * 86400000)
            const status = daysAgo < 3 ? 'Processing' : statuses[Math.floor(random() * statuses.length)]
            await Order.create({
                user: customers[ci]._id,
                orderItems: items,
                shippingInfo: {
                    address: CUSTOMERS[ci].address, city: CUSTOMERS[ci].city,
                    postalCode: CUSTOMERS[ci].postalCode, country: 'Philippines', phoneNo: '09171234567'
                },
                ...calculatePrices(items),
                paymentInfo: { id: 'mock_seed', status: 'succeeded' },
                paidAt: date,
                createdAt: date,
                orderStatus: status,
                deliveredAt: status === 'Delivered' ? date : undefined
            })
            created++
        }

        // Make sure every reviewer actually bought what they review.
        for (const [ci, pi] of REVIEWS) {
            const p = products[pi]
            const items = [{ product: p._id, name: p.name, price: p.price, quantity: 1, image: p.images[0].url }]
            const date = new Date(Date.now() - (20 + pi) * 86400000)
            await Order.create({
                user: customers[ci]._id,
                orderItems: items,
                shippingInfo: {
                    address: CUSTOMERS[ci].address, city: CUSTOMERS[ci].city,
                    postalCode: CUSTOMERS[ci].postalCode, country: 'Philippines', phoneNo: '09171234567'
                },
                ...calculatePrices(items),
                paymentInfo: { id: 'mock_seed', status: 'succeeded' },
                paidAt: date, createdAt: date, orderStatus: 'Delivered', deliveredAt: date
            })
            created++
        }
        console.log(`\nCreated ${created} demo orders over the last 60 days.`)

        for (const [ci, pi, rating, comment] of REVIEWS) {
            const p = await Product.findById(products[pi]._id)
            // Dated a few days after the matching purchase, so "newest first" sorting is meaningful.
            const reviewedAt = new Date(Date.now() - (17 + pi) * 86400000 + ci * 3600000)
            p.reviews.push({ user: customers[ci]._id, name: customers[ci].name, rating, comment: cleanText(comment), createdAt: reviewedAt })
            p.updateRatings()
            await p.save({ validateBeforeSave: false })
        }
        console.log(`Created ${REVIEWS.length} demo reviews.`)
    }

    console.log('\nSeeding complete.')
    console.log('Admin login:    admin@eriwork.local / admin1234')
    console.log('Customer login: juan@eriwork.local  / customer1234')
    await mongoose.disconnect()
    process.exit(0)
}

run().catch((err) => {
    console.error('Seeding failed:', err.message)
    process.exit(1)
})
