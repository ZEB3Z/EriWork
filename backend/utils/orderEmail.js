const { formatMoney, TAX_RATE, FREE_SHIPPING_THRESHOLD } = require('./pricing')
const { receiptDownloadUrl, orderPageUrl, RECEIPT_LINK_DAYS } = require('./receiptLink')

const STATUS_STYLES = {
    Processing: { bg: '#fef3c7', color: '#92400e', note: 'We received your order and are preparing it for shipping.' },
    Shipped: { bg: '#dbeafe', color: '#1e40af', note: 'Good news, your order is on its way to you.' },
    Delivered: { bg: '#dcfce7', color: '#166534', note: 'Your order has been delivered. Enjoy your new gear!' },
    Cancelled: { bg: '#fee2e2', color: '#991b1b', note: 'Your order has been cancelled and the reserved items were returned to stock. Contact us if this is unexpected.' }
}

const STEPS = ['Processing', 'Shipped', 'Delivered']

// Escape user-provided text before putting it into HTML.
const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const dateLong = (d) => new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
const timeShort = (d) => new Date(d).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })

// Product photos are SVG/JPG on Cloudinary. Email apps block SVG, so ask Cloudinary
// for a small PNG version of the same image.
const thumb = (url) => {
    if (!url || !/^https?:\/\//i.test(url)) return ''
    return url.includes('/upload/') ? url.replace('/upload/', '/upload/w_120,h_120,c_fill,f_png/') : url
}

// Builds the subject, HTML and plain-text body for an order email.
// type: 'placed' (new order) or 'status' (admin changed the status)
function buildOrderEmail(order, user, type = 'status') {
    const status = STATUS_STYLES[order.orderStatus] || STATUS_STYLES.Processing
    const shortId = String(order._id).slice(-8).toUpperCase()
    const s = order.shippingInfo || {}
    const units = order.orderItems.reduce((n, i) => n + i.quantity, 0)
    const downloadUrl = receiptDownloadUrl(order._id)
    const viewUrl = orderPageUrl(order._id)

    const subject = type === 'placed'
        ? `EriWork — Order #${shortId} confirmed (${formatMoney(order.totalPrice)})`
        : `EriWork — Order #${shortId} is now ${order.orderStatus}`

    const heading = type === 'placed' ? 'Thank you for your order!' : `Your order is ${order.orderStatus.toLowerCase()}`
    const intro = type === 'placed'
        ? `we received your payment of <b>${formatMoney(order.totalPrice)}</b> and your order is being prepared. Here is everything about it.`
        : `the status of your order changed to <b>${esc(order.orderStatus)}</b>. ${status.note}`

    // ---- Progress tracker -------------------------------------------------
    let tracker
    if (order.orderStatus === 'Cancelled') {
        tracker = `<div style="margin:22px 0 0;padding:14px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;font-size:13px;line-height:1.55;color:#991b1b;"><b>Order cancelled.</b> ${status.note}</div>`
    } else {
        const at = STEPS.indexOf(order.orderStatus)
        const cells = STEPS.map((label, i) => {
            const done = i <= at
            const dot = `<div style="width:26px;height:26px;line-height:26px;border-radius:13px;margin:0 auto;font-size:13px;font-weight:700;text-align:center;background:${done ? '#0f766e' : '#e3e8f0'};color:${done ? '#ffffff' : '#94a3b8'};">${done ? '&#10003;' : i + 1}</div>`
            return `<td align="center" style="width:33%;padding:0 4px;vertical-align:top;">${dot}<div style="margin-top:6px;font-size:12px;font-weight:${i === at ? 700 : 500};color:${done ? '#0f1b2d' : '#94a3b8'};">${label}</div></td>`
        }).join('')
        tracker = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;"><tr>${cells}</tr></table>`
    }

    // ---- Items -------------------------------------------------------------
    const td = 'padding:12px 10px;border-bottom:1px solid #e3e8f0;font-size:13px;color:#1f2a37;vertical-align:middle;'
    const rows = order.orderItems.map((item) => {
        const img = thumb(item.image)
        return `
        <tr>
          <td style="${td}width:56px;padding-right:0;">${img ? `<img src="${esc(img)}" width="48" height="48" alt="" style="display:block;width:48px;height:48px;border-radius:8px;border:1px solid #e3e8f0;object-fit:cover;">` : ''}</td>
          <td style="${td}"><div style="font-weight:600;color:#0f1b2d;line-height:1.35;">${esc(item.name)}</div><div style="margin-top:3px;font-size:12px;color:#64748b;">${formatMoney(item.price)} each</div></td>
          <td style="${td}text-align:center;white-space:nowrap;">&times; ${item.quantity}</td>
          <td style="${td}text-align:right;font-weight:700;color:#0f1b2d;white-space:nowrap;">${formatMoney(item.price * item.quantity)}</td>
        </tr>`
    }).join('')

    const totalLine = (label, value, strong) => `
        <tr>
          <td style="padding:5px 0;font-size:${strong ? 15 : 13}px;color:${strong ? '#0f766e' : '#64748b'};${strong ? 'font-weight:800;padding-top:10px;border-top:1px solid #e3e8f0;' : ''}">${label}</td>
          <td style="padding:5px 0;font-size:${strong ? 18 : 13}px;text-align:right;color:${strong ? '#0f766e' : '#1f2a37'};${strong ? 'font-weight:800;padding-top:10px;border-top:1px solid #e3e8f0;' : 'font-weight:600;'}">${value}</td>
        </tr>`

    const paymentId = order.paymentInfo && order.paymentInfo.id ? order.paymentInfo.id : '-'
    const box = 'padding:14px 16px;background:#f6f8fb;border-radius:10px;font-size:13px;line-height:1.6;color:#1f2a37;vertical-align:top;'
    const label = 'font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:6px;'

    const button = (href, text, primary) => `<a href="${esc(href)}" style="display:inline-block;margin:4px 6px 4px 0;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;${primary ? 'background:#0f766e;color:#ffffff;' : 'background:#ffffff;color:#0f766e;border:1px solid #0f766e;'}">${text}</a>`

    const html = `
<div style="background:#f5f7fb;padding:32px 12px;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e3e8f0;">
    <tr>
      <td style="background:#0f766e;padding:26px 30px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:26px;font-weight:800;color:#ffffff;">EriWork</td>
          <td align="right" style="font-size:13px;color:#d4f3ee;line-height:1.5;">Order <b style="color:#ffffff;">#${shortId}</b><br>${dateLong(order.createdAt)}, ${timeShort(order.createdAt)}</td>
        </tr></table>
      </td>
    </tr>
    <tr>
      <td style="padding:30px;">
        <p style="margin:0 0 6px;font-size:22px;font-weight:800;color:#0f1b2d;">${heading}</p>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.65;color:#1f2a37;">Hi ${esc(user.name)}, ${intro}</p>
        <span style="display:inline-block;padding:6px 14px;border-radius:999px;background:${status.bg};color:${status.color};font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;">${esc(order.orderStatus)}</span>
        ${tracker}

        <p style="margin:30px 0 10px;font-size:15px;font-weight:700;color:#0f1b2d;">Items (${units})</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #0f1b2d;">
          ${rows}
        </table>

        <table role="presentation" width="260" cellpadding="0" cellspacing="0" align="right" style="margin-top:14px;">
          ${totalLine('Subtotal', formatMoney(order.itemsPrice))}
          ${totalLine('Shipping', order.shippingPrice ? formatMoney(order.shippingPrice) : '<span style="color:#15803d;">Free</span>')}
          ${totalLine(`VAT (${Math.round(TAX_RATE * 100)}%)`, formatMoney(order.taxPrice))}
          ${totalLine('Grand total', formatMoney(order.totalPrice), true)}
        </table>
        <div style="clear:both;height:1px;line-height:1px;">&nbsp;</div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:26px;border-collapse:separate;border-spacing:0;">
          <tr>
            <td width="50%" style="${box}">
              <div style="${label}">Shipping to</div>
              <b style="color:#0f1b2d;">${esc(user.name)}</b><br>
              ${esc(s.address)}<br>
              ${esc(s.city)} ${esc(s.postalCode)}<br>
              ${esc(s.country)}<br>
              <span style="color:#64748b;">Phone: ${esc(s.phoneNo)}</span>
            </td>
            <td width="12" style="font-size:0;line-height:0;">&nbsp;</td>
            <td width="50%" style="${box}">
              <div style="${label}">Payment</div>
              <b style="color:#0f1b2d;">Paid in full</b> &middot; Card (demo)<br>
              ${formatMoney(order.totalPrice)} on ${dateLong(order.paidAt || order.createdAt)}<br>
              <span style="color:#64748b;">Reference: ${esc(String(paymentId).slice(0, 24))}</span><br>
              <span style="color:#64748b;">Order ID: ${esc(String(order._id))}</span>
            </td>
          </tr>
        </table>

        <div style="margin-top:28px;padding:18px 18px 14px;background:#e6f6f3;border:1px solid #99e0d6;border-radius:10px;">
          <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#0b5a54;">Your PDF receipt</p>
          <p style="margin:0 0 12px;font-size:13px;line-height:1.55;color:#1f2a37;">It is attached to this email. You can also download it again any time with the button below${type === 'status' ? '' : ' or from your order page'} (the link works for ${RECEIPT_LINK_DAYS} days).</p>
          ${button(downloadUrl, 'Download PDF receipt', true)}${button(viewUrl, 'View order', false)}
        </div>

        <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#64748b;">Free shipping applies to item totals above ${formatMoney(FREE_SHIPPING_THRESHOLD)}. All amounts are in Philippine pesos (PHP).</p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 30px;background:#0f1b2d;font-size:12px;line-height:1.6;color:#b9c4d4;text-align:center;">
        EriWork &mdash; ITCP318 academic project. No real payment was charged.
      </td>
    </tr>
  </table>
</div>`

    // Plain-text version for email clients that don't show HTML.
    const text = [
        `Hi ${user.name},`,
        '',
        type === 'placed'
            ? `Thanks for your order! We received your payment of ${formatMoney(order.totalPrice)}.`
            : `Your order status is now: ${order.orderStatus}. ${status.note}`,
        '',
        `Order #${shortId} · ${dateLong(order.createdAt)}`,
        '',
        ...order.orderItems.map((i) =>
            `- ${i.name} x${i.quantity} @ ${formatMoney(i.price)} = ${formatMoney(i.price * i.quantity)}`),
        '',
        `Subtotal: ${formatMoney(order.itemsPrice)}`,
        `Shipping: ${order.shippingPrice ? formatMoney(order.shippingPrice) : 'Free'}`,
        `VAT (${Math.round(TAX_RATE * 100)}%): ${formatMoney(order.taxPrice)}`,
        `Grand total: ${formatMoney(order.totalPrice)}`,
        '',
        `Shipping to: ${s.address}, ${s.city} ${s.postalCode}, ${s.country} (${s.phoneNo})`,
        '',
        'Your PDF receipt is attached.',
        `Download it again: ${downloadUrl}`,
        `View your order: ${viewUrl}`
    ].join('\n')

    return { subject, html, text }
}

module.exports = buildOrderEmail
