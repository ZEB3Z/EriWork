const PDFDocument = require('pdfkit');
const { formatMoney, TAX_RATE } = require('./pricing');

const COLORS = {
    brand: '#0f766e',
    ink: '#0f1b2d',
    muted: '#64748b',
    border: '#e3e8f0',
    stripe: '#f5f7fb'
};

const STATUS_COLORS = {
    Processing: '#b45309',
    Shipped: '#1d4ed8',
    Delivered: '#15803d',
    Cancelled: '#b91c1c'
};

const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

// Builds a one-page PDF receipt for an order and resolves with a Buffer,
// ready to be attached to an email.
function generateReceiptPdf(order, user) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks = [];
        doc.on('data', (c) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const left = 50;
        const right = doc.page.width - 50;
        const width = right - left;

        // ---- Header band ----
        doc.rect(0, 0, doc.page.width, 100).fill(COLORS.brand);
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(26).text('EriWork', left, 32);
        doc.font('Helvetica').fontSize(10).fillColor('#d4f3ee')
            .text('Networking products for home and office', left, 64);
        doc.font('Helvetica-Bold').fontSize(18).fillColor('#ffffff')
            .text('Receipt', left, 36, { width, align: 'right' });
        doc.font('Helvetica').fontSize(10).fillColor('#d4f3ee')
            .text(`#${String(order._id).slice(-8).toUpperCase()}`, left, 62, { width, align: 'right' });

        // ---- Billed to / Order details ----
        let y = 130;
        const colWidth = width / 2 - 10;
        const label = (text, x, yy) =>
            doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.muted).text(text, x, yy);
        const body = (text, x, yy, opts = {}) =>
            doc.font('Helvetica').fontSize(10).fillColor(COLORS.ink).text(text, x, yy, { width: colWidth, ...opts });

        const s = order.shippingInfo || {};
        label('Billed to', left, y);
        body(user ? user.name : 'Customer', left, y + 16);
        body(user ? user.email : '', left, y + 30);
        body(`${s.address || ''}, ${s.city || ''}`, left, y + 44);
        body(`${s.postalCode || ''} ${s.country || ''}`, left, y + 58);
        body(`Phone: ${s.phoneNo || ''}`, left, y + 72);

        const rx = left + width / 2 + 10;
        label('Order details', rx, y);
        const detail = (k, v, yy, color) => {
            doc.font('Helvetica').fontSize(10).fillColor(COLORS.muted).text(k, rx, yy);
            doc.font('Helvetica-Bold').fillColor(color || COLORS.ink).text(v, rx + 90, yy, { width: colWidth - 90 });
        };
        detail('Order ID', String(order._id), y + 16);
        detail('Order date', formatDate(order.createdAt), y + 30);
        detail('Payment', 'Paid', y + 44, '#15803d');
        detail('Status', order.orderStatus, y + 58, STATUS_COLORS[order.orderStatus]);

        // ---- Items table ----
        y = 245;
        const cols = [
            { title: 'Item', x: left + 10, w: 250, align: 'left' },
            { title: 'Qty', x: left + 270, w: 40, align: 'center' },
            { title: 'Unit price', x: left + 315, w: 85, align: 'right' },
            { title: 'Subtotal', x: left + 405, w: width - 415, align: 'right' }
        ];

        doc.rect(left, y, width, 26).fill(COLORS.ink);
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff');
        cols.forEach((c) => doc.text(c.title, c.x, y + 8, { width: c.w, align: c.align }));
        y += 26;

        order.orderItems.forEach((item, i) => {
            doc.font('Helvetica').fontSize(10);
            const rowHeight = Math.max(26, doc.heightOfString(item.name, { width: cols[0].w }) + 14);

            if (i % 2 === 1) doc.rect(left, y, width, rowHeight).fill(COLORS.stripe);
            doc.fillColor(COLORS.ink);
            const values = [
                item.name,
                String(item.quantity),
                formatMoney(item.price),
                formatMoney(item.price * item.quantity)
            ];
            cols.forEach((c, idx) => doc.text(values[idx], c.x, y + 8, { width: c.w, align: c.align }));
            y += rowHeight;
        });
        doc.moveTo(left, y).lineTo(right, y).lineWidth(1).strokeColor(COLORS.border).stroke();

        // ---- Totals ----
        y += 16;
        const tx = left + width - 230;
        const totalRow = (k, v, bold) => {
            doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 12 : 10)
                .fillColor(bold ? COLORS.brand : COLORS.muted).text(k, tx, y, { width: 120 });
            doc.fillColor(bold ? COLORS.brand : COLORS.ink).text(v, tx + 120, y, { width: 110, align: 'right' });
            y += bold ? 22 : 18;
        };
        totalRow('Subtotal', formatMoney(order.itemsPrice));
        totalRow('Shipping', order.shippingPrice ? formatMoney(order.shippingPrice) : 'Free');
        totalRow(`Tax (${Math.round(TAX_RATE * 100)}%)`, formatMoney(order.taxPrice));
        doc.moveTo(tx, y).lineTo(right, y).strokeColor(COLORS.border).stroke();
        y += 8;
        totalRow('Grand total', formatMoney(order.totalPrice), true);

        // ---- Footer ----
        const footerY = doc.page.height - 90;
        doc.moveTo(left, footerY).lineTo(right, footerY).strokeColor(COLORS.border).stroke();
        doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.ink)
            .text('Thank you for shopping with EriWork.', left, footerY + 14, { width, align: 'center' });
        doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted)
            .text('This receipt was generated automatically. ITCP318 academic project — no real payment was charged.',
                left, footerY + 30, { width, align: 'center' });

        doc.end();
    });
}

module.exports = generateReceiptPdf;
