// ---------------------------------------------------------------------------
// Session token (Bearer fallback)
// ---------------------------------------------------------------------------
// The real session is the httpOnly cookie the API sets, and the logged-in user
// lives in Redux (src/redux). The token is also kept here for this browser tab
// only, so browsers that block cross-site cookies (e.g. Safari) still work.

export const setToken = (token) => {
    if (token) sessionStorage.setItem('token', token)
}

export const getToken = () => sessionStorage.getItem('token') || null

export const clearToken = () => sessionStorage.removeItem('token')

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

// Images are hosted on Cloudinary, so they are full https:// URLs. Local
// previews use blob: URLs. Anything else (e.g. the "placeholder" avatar) has no image.
export const resolveImageUrl = (url) => {
    if (!url) return ''
    if (/^https?:\/\//i.test(url) || url.startsWith('blob:') || url.startsWith('data:')) return url
    return ''
}

// All prices are in Philippine pesos (PHP).
export const formatMoney = (n) =>
    '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Short axis labels for charts: ₱1.2k, ₱15k, ₱1.5M
export const formatMoneyShort = (n) => {
    const v = Number(n || 0)
    if (v >= 1e6) return `₱${+(v / 1e6).toFixed(1)}M`
    if (v >= 1e3) return `₱${+(v / 1e3).toFixed(1)}k`
    return `₱${v}`
}

export const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

export const shortId = (id) => '#' + String(id).slice(-8).toUpperCase()

// ---------------------------------------------------------------------------
// Pricing — same rules as backend/utils/pricing.js (the server has the final say)
// ---------------------------------------------------------------------------

export const USD_TO_PHP = 60            // the catalogue was converted from USD at 1 USD = 60 PHP
export const TAX_RATE = 0.12
export const SHIPPING_FEE = 10 * USD_TO_PHP            // ₱600
export const FREE_SHIPPING_THRESHOLD = 100 * USD_TO_PHP // free shipping above ₱6,000

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

// Downloads the PDF receipt of an order. The API checks that you own the order (or are an admin).
export const downloadReceipt = async (api, orderId) => {
    const { data } = await api.get(`/order/${orderId}/receipt`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `EriWork-Receipt-${String(orderId).slice(-8).toUpperCase()}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10000)
}

export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
export const MAX_IMAGE_MB = 5

// A picked file plus a local preview URL. The File itself is sent to the API as
// multipart/form-data (Multer on the server, then Cloudinary).
export const toUpload = (file) => ({ file, preview: URL.createObjectURL(file) })
export const releaseUpload = (upload) => upload && URL.revokeObjectURL(upload.preview)

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
