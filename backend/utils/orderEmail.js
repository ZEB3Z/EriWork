const { formatMoney, TAX_RATE } = require('./pricing');

const STATUS_STYLES = {
    Processing: { bg: '#fef3c7', color: '#92400e', note: 'We received your order and are preparing it.' },
    Shipped: { bg: '#dbeafe', color: '#1e40af', note: 'Good news — your order is on its way.' },
    Delivered: { bg: '#dcfce7', color: '#166534', note: 'Your order has been delivered. Enjoy your new gear!' },
    Cancelled: { bg: '#fee2e2', color: '#991b1b', note: 'Your order has been cancelled. Contact us if this is unexpected.' }
};

// Escape user-provided text before putting it into HTML.
const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Builds the subject, HTML and plain-text body for an order email.
// type: 'placed' (new order) or 'status' (admin changed the status)
function buildOrderEmail(order, user, type = 'status') {
    const status = STATUS_STYLES[order.orderStatus] || STATUS_STYLES.Processing;
    const shortId = String(order._id).slice(-8).toUpperCase();
    const s = order.shippingInfo || {};

    const subject = type === 'placed'
        ? `EriWork — Order #${shortId} confirmed`
        : `EriWork — Order #${shortId} is now ${order.orderStatus}`;

    const intro = type === 'placed'
        ? 'Thanks for your order! Here is a summary of what you bought.'
        : `Your order status was updated to <b>${esc(order.orderStatus)}</b>. ${status.note}`;

    const td = 'padding:12px 14px;border-bottom:1px solid #e3e8f0;font-size:14px;color:#1f2a37;';
    const rows = order.orderItems.map((item) => `
        <tr>
          <td style="${td}">${esc(item.name)}</td>
          <td style="${td}text-align:center;">${item.quantity}</td>
          <td style="${td}text-align:right;">${formatMoney(item.price)}</td>
          <td style="${td}text-align:right;font-weight:600;">${formatMoney(item.price * item.quantity)}</td>
        </tr>`).join('');

    const totalLine = (label, value, strong) => `
        <tr>
          <td style="padding:6px 14px;font-size:${strong ? 16 : 14}px;color:${strong ? '#0f766e' : '#64748b'};${strong ? 'font-weight:700;' : ''}">${label}</td>
          <td style="padding:6px 14px;font-size:${strong ? 16 : 14}px;text-align:right;color:${strong ? '#0f766e' : '#1f2a37'};${strong ? 'font-weight:700;' : ''}">${value}</td>
        </tr>`;

    const html = `
<div style="background:#f5f7fb;padding:32px 12px;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e3e8f0;">
    <tr>
      <td style="background:#0f766e;padding:24px 28px;">
        <div style="font-size:24px;font-weight:800;color:#ffffff;">EriWork</div>
        <div style="font-size:13px;color:#d4f3ee;margin-top:4px;">Order #${shortId}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:28px;">
        <p style="margin:0 0 12px;font-size:16px;color:#0f1b2d;">Hi ${esc(user.name)},</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#1f2a37;">${intro}</p>
        <span style="display:inline-block;padding:6px 14px;border-radius:999px;background:${status.bg};color:${status.color};font-size:13px;font-weight:700;">${esc(order.orderStatus)}</span>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border:1px solid #e3e8f0;border-radius:8px;border-collapse:separate;overflow:hidden;">
          <tr style="background:#0f1b2d;">
            <th align="left" style="padding:12px 14px;font-size:13px;color:#ffffff;">Product</th>
            <th style="padding:12px 14px;font-size:13px;color:#ffffff;">Qty</th>
            <th align="right" style="padding:12px 14px;font-size:13px;color:#ffffff;">Price</th>
            <th align="right" style="padding:12px 14px;font-size:13px;color:#ffffff;">Subtotal</th>
          </tr>
          ${rows}
        </table>

        <table role="presentation" width="280" cellpadding="0" cellspacing="0" align="right" style="margin-top:16px;">
          ${totalLine('Subtotal', formatMoney(order.itemsPrice))}
          ${totalLine('Shipping', order.shippingPrice ? formatMoney(order.shippingPrice) : 'Free')}
          ${totalLine(`Tax (${Math.round(TAX_RATE * 100)}%)`, formatMoney(order.taxPrice))}
          ${totalLine('Grand total', formatMoney(order.totalPrice), true)}
        </table>
        <div style="clear:both;"></div>

        <div style="margin-top:24px;padding:16px;background:#f5f7fb;border-radius:8px;font-size:13px;line-height:1.6;color:#1f2a37;">
          <b style="color:#0f1b2d;">Shipping to</b><br>
          ${esc(s.address)}, ${esc(s.city)} ${esc(s.postalCode)}, ${esc(s.country)}<br>
          Phone: ${esc(s.phoneNo)}
        </div>

        <p style="margin:20px 0 0;font-size:13px;color:#64748b;">Your PDF receipt is attached to this email.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px;background:#0f1b2d;font-size:12px;color:#b9c4d4;text-align:center;">
        EriWork — ITCP318 academic project. No real payment was charged.
      </td>
    </tr>
  </table>
</div>`;

    // Plain-text version for email clients that don't show HTML.
    const text = [
        `Hi ${user.name},`,
        '',
        type === 'placed' ? 'Thanks for your order!' : `Your order status is now: ${order.orderStatus}.`,
        '',
        ...order.orderItems.map((i) =>
            `- ${i.name} x${i.quantity} @ ${formatMoney(i.price)} = ${formatMoney(i.price * i.quantity)}`),
        '',
        `Subtotal: ${formatMoney(order.itemsPrice)}`,
        `Shipping: ${order.shippingPrice ? formatMoney(order.shippingPrice) : 'Free'}`,
        `Tax: ${formatMoney(order.taxPrice)}`,
        `Grand total: ${formatMoney(order.totalPrice)}`,
        '',
        'Your PDF receipt is attached.'
    ].join('\n');

    return { subject, html, text };
}

module.exports = buildOrderEmail;
