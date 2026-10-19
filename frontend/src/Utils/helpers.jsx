// ---------------------------------------------------------------------------
// Login session (stored in sessionStorage)
// ---------------------------------------------------------------------------

// Fired on login/logout so the header updates immediately.
export const AUTH_EVENT = 'eriwork-auth-changed'
const notify = () => window.dispatchEvent(new Event(AUTH_EVENT))

export const authenticate = (data, next) => {
    sessionStorage.setItem('token', JSON.stringify(data.token))
    sessionStorage.setItem('user', JSON.stringify(data.user))
    notify()
    if (typeof next === 'function') next()
}

// Update the saved user (e.g. after editing the profile) but keep the token.
export const updateStoredUser = (user) => {
    sessionStorage.setItem('user', JSON.stringify(user))
    notify()
}

export const getUser = () => {
    const user = sessionStorage.getItem('user')
    return user ? JSON.parse(user) : false
}

export const getToken = () => {
    const token = sessionStorage.getItem('token')
    return token ? JSON.parse(token) : false
}

export const logout = (next) => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    notify()
    if (typeof next === 'function') next()
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

// Uploaded files are stored as "/uploads/..." on the backend server.
export const resolveImageUrl = (url) => {
    if (!url) return ''
    if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url
    const origin = (import.meta.env.VITE_API || '').replace(/\/api\/v1\/?$/, '')
    return `${origin}${url}`
}

export const formatMoney = (n) =>
    '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

export const shortId = (id) => '#' + String(id).slice(-8).toUpperCase()

// ---------------------------------------------------------------------------
// Pricing — same rules as backend/utils/pricing.js (the server has the final say)
// ---------------------------------------------------------------------------

export const TAX_RATE = 0.12
export const SHIPPING_FEE = 10
export const FREE_SHIPPING_THRESHOLD = 100

const round2 = (n) => Math.round(n * 100) / 100

export const calculatePrices = (items) => {
    const itemsPrice = round2(items.reduce((sum, i) => sum + i.price * i.quantity, 0))
    const shippingPrice = itemsPrice > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
    const taxPrice = round2(itemsPrice * TAX_RATE)
    return { itemsPrice, shippingPrice, taxPrice, totalPrice: round2(itemsPrice + shippingPrice + taxPrice) }
}

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
export const MAX_IMAGE_MB = 5

// Read a File into a base64 data URI (what the backend expects).
export const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })

// Returns an error message, or null if the file is fine.
export const checkImageFile = (file) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return `${file.name}: please use PNG, JPG or WEBP`
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `${file.name}: must be under ${MAX_IMAGE_MB} MB`
    return null
}

// Avatar image for a user, or '' to show their initial instead of the grey placeholder.
export const avatarSrc = (user) => {
    const url = user && user.avatar && user.avatar.url
    return url && !url.includes('placeholder') ? resolveImageUrl(url) : ''
}
