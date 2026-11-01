const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const COPY = {
    register: {
        subject: 'Verify your email',
        heading: 'Confirm your email address',
        lead: 'Use this code to finish creating your EriWork account.'
    },
    login: {
        subject: 'Your login code',
        heading: 'Log in to EriWork',
        lead: 'Use this code to finish logging in.'
    },
    reset: {
        subject: 'Your password reset code',
        heading: 'Reset your password',
        lead: 'Use this code to choose a new password for your EriWork account.'
    },
    checkout: {
        subject: 'Confirm your payment',
        heading: 'Confirm your order',
        lead: 'Use this code to confirm and place your order.'
    },
    password: {
        subject: 'Confirm your password change',
        heading: 'Change your password',
        lead: 'Use this code to confirm the change to your password.'
    }
}

// Builds the subject, HTML and plain text for a one-time-code email.
function buildOtpEmail({ code, purpose, name, minutes }) {
    const c = COPY[purpose] || COPY.login
    const subject = `EriWork — ${c.subject}: ${code}`
    const digits = String(code).split('')
        .map((d) => `<td style="width:46px;height:56px;text-align:center;background:#f0fdfa;border:1px solid #99e0d6;border-radius:10px;font-size:28px;font-weight:800;color:#0f766e;font-family:Consolas,Menlo,monospace;">${d}</td>`)
        .join('<td style="width:8px;"></td>')

    const html = `
<div style="background:#f5f7fb;padding:32px 12px;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e3e8f0;">
    <tr><td style="background:#0f766e;padding:22px 28px;font-size:22px;font-weight:800;color:#ffffff;">EriWork</td></tr>
    <tr>
      <td style="padding:30px 28px 10px;">
        <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#0f1b2d;">${c.heading}</p>
        <p style="margin:0 0 4px;font-size:14px;line-height:1.6;color:#1f2a37;">Hi ${esc(name || 'there')},</p>
        <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#1f2a37;">${c.lead}</p>
        <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 22px;"><tr>${digits}</tr></table>
        <p style="margin:0 0 6px;text-align:center;font-size:13px;color:#64748b;">This code expires in <b style="color:#0f1b2d;">${minutes} minutes</b> and works once.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:6px 28px 28px;">
        <div style="padding:14px 16px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;font-size:13px;line-height:1.55;color:#7c2d12;">
          <b>Never share this code.</b> EriWork staff will never ask for it. If you did not request it, you can ignore this email.
        </div>
      </td>
    </tr>
    <tr><td style="padding:14px 28px;background:#0f1b2d;font-size:12px;color:#b9c4d4;text-align:center;">EriWork — ITCP318 academic project</td></tr>
  </table>
</div>`

    const text = [
        `Hi ${name || 'there'},`,
        '',
        c.lead,
        '',
        `Your code: ${code}`,
        '',
        `It expires in ${minutes} minutes and works once. Never share it with anyone.`,
        'If you did not request it, ignore this email.'
    ].join('\n')

    return { subject, html, text }
}

module.exports = buildOtpEmail
