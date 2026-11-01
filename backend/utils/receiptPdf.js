const path = require('path')
const PDFDocument = require('pdfkit')
const { TAX_RATE, FREE_SHIPPING_THRESHOLD } = require('./pricing')

// Inter (SIL Open Font License) trimmed to Latin + the peso sign. PDF's built-in
// Helvetica has no ₱ glyph, so the fonts ship with the project in backend/assets/fonts.
const FONT_DIR = path.join(__dirname, '..', 'assets', 'fonts')
const FONTS = {
    regular: path.join(FONT_DIR, 'Inter-Regular.otf'),
    semi: path.join(FONT_DIR, 'Inter-SemiBold.otf'),
    bold: path.join(FONT_DIR, 'Inter-Bold.otf')
}

const C = {
    brand: '#0f766e',
    brandDark: '#0b5a54',
    brandSoft: '#e6f6f3',
    brandLine: '#99e0d6',
    ink: '#0f1b2d',
    text: '#1f2a37',
    muted: '#64748b',
    line: '#e3e8f0',
    card: '#f6f8fb',
    stripe: '#fafbfd',
    white: '#ffffff'
}

const STATUS = {
    Processing: { bg: '#fef3c7', fg: '#92400e' },
    Shipped: { bg: '#dbeafe', fg: '#1e40af' },
    Delivered: { bg: '#dcfce7', fg: '#166534' },
    Cancelled: { bg: '#fee2e2', fg: '#991b1b' }
}

const php = (n) => '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const dateLong = (d) => new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
const timeShort = (d) => new Date(d).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })

const PAGE_W = 595.28
const PAGE_H = 841.89
const M = 44                       // left / right margin
const CONTENT_W = PAGE_W - M * 2
const FOOTER_TOP = PAGE_H - 70     // nothing but the footer lives below this line

// Builds a polished A4 receipt and resolves with a Buffer (email attachment or HTTP download).
function generateReceiptPdf(order, user) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            margin: 0,
            bufferPages: true,
            info: {
                Title: `EriWork Receipt #${String(order._id).slice(-8).toUpperCase()}`,
                Author: 'EriWork',
                Subject: 'Order receipt'
            }
        })
        const chunks = []
        doc.on('data', (c) => chunks.push(c))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', reject)

        try {
            doc.registerFont('R', FONTS.regular)
            doc.registerFont('S', FONTS.semi)
            doc.registerFont('B', FONTS.bold)
            draw(doc, order, user)
            doc.end()
        } catch (err) {
            reject(err)
        }
    })
}

// ---------------------------------------------------------------------------

const text = (doc, str, x, y, { font = 'R', size = 10, color = C.text, width, align = 'left', lineGap = 0 } = {}) => {
    doc.font(font).fontSize(size).fillColor(color)
    doc.text(String(str ?? ''), x, y, { width, align, lineGap, lineBreak: width !== undefined })
}

const pill = (doc, label, x, y, { bg, fg, size = 8.5, padX = 10, h = 20 }) => {
    doc.font('B').fontSize(size)
    const w = doc.widthOfString(label) + padX * 2
    doc.roundedRect(x, y, w, h, h / 2).fill(bg)
    doc.fillColor(fg).text(label, x + padX, y + (h - size) / 2 - 0.5, { lineBreak: false })
    return w
}

// Brand mark: white rounded square with Wi-Fi arcs.
const logo = (doc, x, y, size = 38) => {
    doc.roundedRect(x, y, size, size, 10).fill(C.white)
    const cx = x + size / 2
    const cy = y + size * 0.68
    doc.lineWidth(2.6).lineCap('round').strokeColor(C.brand)
    ;[size * 0.17, size * 0.3, size * 0.43].forEach((r) => {
        const d = r * Math.SQRT1_2
        doc.path(`M ${cx - d} ${cy - d} A ${r} ${r} 0 0 1 ${cx + d} ${cy - d}`).stroke()
    })
    doc.circle(cx, cy, 2.4).fill(C.brand)
}

function header(doc, order, { compact = false } = {}) {
    const shortId = String(order._id).slice(-8).toUpperCase()
    if (compact) {
        doc.rect(0, 0, PAGE_W, 58).fill(C.brand)
        logo(doc, M, 11, 36)
        text(doc, 'EriWork', M + 48, 20, { font: 'B', size: 16, color: C.white })
        text(doc, `Receipt #${shortId} (continued)`, M, 23, { font: 'S', size: 10, color: '#d4f3ee', width: CONTENT_W, align: 'right' })
        return 58
    }

    // Colour band with soft decorative circles
    doc.save()
    doc.rect(0, 0, PAGE_W, 150).clip()
    doc.rect(0, 0, PAGE_W, 150).fill(C.brand)
    doc.circle(PAGE_W - 30, -20, 120).fillOpacity(0.08).fill(C.white)
    doc.circle(PAGE_W - 150, 150, 90).fillOpacity(0.06).fill(C.white)
    doc.circle(40, 170, 80).fillOpacity(0.05).fill(C.white)
    doc.fillOpacity(1)
    doc.restore()

    logo(doc, M, 36, 44)
    text(doc, 'EriWork', M + 58, 40, { font: 'B', size: 24, color: C.white })
    text(doc, 'Networking gear for home and office', M + 58, 70, { size: 9.5, color: '#bfece5' })

    text(doc, 'RECEIPT', M, 38, { font: 'B', size: 11, color: '#bfece5', width: CONTENT_W, align: 'right' })
    text(doc, `#${shortId}`, M, 54, { font: 'B', size: 24, color: C.white, width: CONTENT_W, align: 'right' })
    text(doc, `${dateLong(order.createdAt)}  ·  ${timeShort(order.createdAt)}`, M, 86, { size: 9.5, color: '#bfece5', width: CONTENT_W, align: 'right' })

    // Status + paid pills hanging off the band
    const st = STATUS[order.orderStatus] || STATUS.Processing
    let px = M
    px += pill(doc, order.orderStatus.toUpperCase(), px, 120, { bg: st.bg, fg: st.fg }) + 8
    pill(doc, 'PAID', px, 120, { bg: '#dcfce7', fg: '#166534' })
    return 150
}

function infoCard(doc, x, y, w, h, title, lines) {
    doc.roundedRect(x, y, w, h, 10).fill(C.card)
    doc.rect(x, y + 14, 3, 14).fill(C.brand)
    text(doc, title.toUpperCase(), x + 14, y + 16, { font: 'B', size: 7.5, color: C.muted })
    let ly = y + 36
    lines.forEach(({ value, font = 'R', color = C.text, size = 9.5 }, i) => {
        if (value === undefined || value === null || value === '') return
        doc.font(font).fontSize(size)
        const hgt = doc.heightOfString(String(value), { width: w - 28 })
        text(doc, value, x + 14, ly, { font, size, color, width: w - 28 })
        ly += hgt + (i === 0 ? 3 : 2)
    })
}

function draw(doc, order, user) {
    const s = order.shippingInfo || {}
    const items = order.orderItems || []

    // ---------------- Header ----------------
    let y = header(doc, order) + 22

    // ---------------- Info cards ----------------
    const gap = 12
    const cw = (CONTENT_W - gap * 2) / 3
    const ch = 118
    infoCard(doc, M, y, cw, ch, 'Billed to', [
        { value: user ? user.name : 'Customer', font: 'S', color: C.ink, size: 11 },
        { value: user ? user.email : '', color: C.muted },
        { value: `Phone: ${s.phoneNo || '-'}`, color: C.muted }
    ])
    infoCard(doc, M + cw + gap, y, cw, ch, 'Ship to', [
        { value: user ? user.name : 'Customer', font: 'S', color: C.ink, size: 11 },
        { value: s.address },
        { value: `${s.city || ''} ${s.postalCode || ''}`.trim() },
        { value: s.country }
    ])
    const paymentId = order.paymentInfo && order.paymentInfo.id ? order.paymentInfo.id : '-'
    infoCard(doc, M + (cw + gap) * 2, y, cw, ch, 'Order details', [
        { value: `Order ID`, color: C.muted, size: 8 },
        { value: String(order._id), font: 'S', color: C.ink, size: 8.5 },
        { value: `Paid ${dateLong(order.paidAt || order.createdAt)}`, color: C.text },
        { value: `Method: Card (demo)  ·  ${paymentId.slice(0, 18)}`, color: C.muted, size: 8 }
    ])
    y += ch + 26

    // ---------------- Items table ----------------
    text(doc, 'Items ordered', M, y, { font: 'B', size: 13, color: C.ink })
    const units = items.reduce((n, i) => n + i.quantity, 0)
    text(doc, `${units} item${units === 1 ? '' : 's'}`, M, y + 2, { size: 9.5, color: C.muted, width: CONTENT_W, align: 'right' })
    y += 26

    const cols = {
        n: { x: M + 14, w: 22 },
        name: { x: M + 40, w: 232 },
        qty: { x: M + 282, w: 40 },
        unit: { x: M + 328, w: 80 },
        sub: { x: M + 414, w: CONTENT_W - 414 - 14 }
    }

    const tableHead = (yy) => {
        doc.roundedRect(M, yy, CONTENT_W, 28, 8).fill(C.ink)
        const t = (label, c, align) => text(doc, label, c.x, yy + 10, { font: 'B', size: 8, color: C.white, width: c.w, align })
        t('#', cols.n, 'left'); t('ITEM', cols.name, 'left'); t('QTY', cols.qty, 'center')
        t('UNIT PRICE', cols.unit, 'right'); t('AMOUNT', cols.sub, 'right')
        return yy + 28
    }
    y = tableHead(y)

    items.forEach((item, i) => {
        doc.font('S').fontSize(9.5)
        const nameH = doc.heightOfString(item.name, { width: cols.name.w })
        const rowH = Math.max(34, nameH + 20)

        if (y + rowH > FOOTER_TOP - 10) {
            doc.addPage()
            y = header(doc, order, { compact: true }) + 18
            y = tableHead(y)
        }
        if (i % 2 === 1) doc.rect(M, y, CONTENT_W, rowH).fill(C.stripe)
        const ty = y + (rowH - 10) / 2 - 1
        text(doc, String(i + 1), cols.n.x, ty, { size: 9, color: C.muted, width: cols.n.w })
        text(doc, item.name, cols.name.x, y + (rowH - nameH) / 2 - 1, { font: 'S', size: 9.5, color: C.ink, width: cols.name.w })
        text(doc, String(item.quantity), cols.qty.x, ty, { size: 9.5, width: cols.qty.w, align: 'center' })
        text(doc, php(item.price), cols.unit.x, ty, { size: 9.5, width: cols.unit.w, align: 'right' })
        text(doc, php(item.price * item.quantity), cols.sub.x, ty, { font: 'B', size: 9.5, color: C.ink, width: cols.sub.w, align: 'right' })
        y += rowH
        doc.moveTo(M, y).lineTo(M + CONTENT_W, y).lineWidth(0.6).strokeColor(C.line).stroke()
    })

    // ---------------- Totals + notes ----------------
    y += 22
    const totalsH = 156
    if (y + totalsH > FOOTER_TOP) {
        doc.addPage()
        y = header(doc, order, { compact: true }) + 22
    }

    // Notes (left)
    const noteW = CONTENT_W - 250 - 20
    doc.roundedRect(M, y, noteW, totalsH - 10, 10).fill(C.brandSoft)
    text(doc, 'GOOD TO KNOW', M + 16, y + 16, { font: 'B', size: 7.5, color: C.brandDark })
    const notes = [
        `All amounts are in Philippine pesos (PHP).`,
        `VAT of ${Math.round(TAX_RATE * 100)}% is added to the item subtotal.`,
        `Shipping is free on item totals above ${php(FREE_SHIPPING_THRESHOLD)}.`,
        order.orderStatus === 'Cancelled'
            ? 'This order was cancelled. Reserved stock has been returned.'
            : 'Keep this receipt as your proof of purchase.'
    ]
    let ny = y + 34
    notes.forEach((n) => {
        doc.circle(M + 19, ny + 4.5, 1.6).fill(C.brand)
        doc.font('R').fontSize(8.8)
        const h = doc.heightOfString(n, { width: noteW - 44 })
        text(doc, n, M + 28, ny, { size: 8.8, color: C.text, width: noteW - 44 })
        ny += h + 6
    })

    // Totals (right)
    const tx = M + CONTENT_W - 250
    const tw = 250
    let ty2 = y + 4
    const row = (label, value, color = C.text) => {
        text(doc, label, tx, ty2, { size: 9.5, color: C.muted, width: 130 })
        text(doc, value, tx + 100, ty2, { font: 'S', size: 9.5, color, width: tw - 100, align: 'right' })
        ty2 += 22
    }
    row('Subtotal', php(order.itemsPrice))
    row('Shipping', order.shippingPrice ? php(order.shippingPrice) : 'Free', order.shippingPrice ? C.text : '#15803d')
    row(`VAT (${Math.round(TAX_RATE * 100)}%)`, php(order.taxPrice))
    doc.moveTo(tx, ty2 + 2).lineTo(tx + tw, ty2 + 2).lineWidth(0.6).strokeColor(C.line).stroke()
    ty2 += 12
    doc.roundedRect(tx, ty2, tw, 46, 10).fill(C.brand)
    text(doc, 'GRAND TOTAL', tx + 16, ty2 + 10, { font: 'B', size: 7.5, color: '#bfece5' })
    text(doc, php(order.totalPrice), tx + 16, ty2 + 21, { font: 'B', size: 17, color: C.white, width: tw - 32, align: 'left' })

    // ---------------- Footer on every page ----------------
    const range = doc.bufferedPageRange()
    for (let p = 0; p < range.count; p++) {
        doc.switchToPage(range.start + p)
        doc.moveTo(M, FOOTER_TOP).lineTo(M + CONTENT_W, FOOTER_TOP).lineWidth(0.6).strokeColor(C.line).stroke()
        text(doc, 'Thank you for shopping with EriWork.', M, FOOTER_TOP + 14, { font: 'S', size: 9.5, color: C.ink })
        text(doc, 'Generated automatically. ITCP318 academic project; no real payment was charged.', M, FOOTER_TOP + 29, { size: 7.8, color: C.muted, width: CONTENT_W - 80 })
        text(doc, `Page ${p + 1} of ${range.count}`, M, FOOTER_TOP + 14, { size: 8, color: C.muted, width: CONTENT_W, align: 'right' })
    }
}

module.exports = generateReceiptPdf
