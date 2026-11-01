import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { getErrorMessage } from '../../api'
import { OTP_LENGTH } from '../../Utils/otp'

// ---------------------------------------------------------------------------
// Reusable pieces for the one-time-code (OTP) screens.
//   <OtpCodeField>  the 6-digit input
//   <ResendCode>    "Resend code" button with a 30-second countdown
//   <OtpPanel>      both of them plus a confirm button (used by login, register, checkout)
// ---------------------------------------------------------------------------

export function OtpCodeField({ value, onChange, error, autoFocus = true, disabled }) {
    return (
        <TextField
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
            label="6-digit code"
            placeholder="123456"
            autoFocus={autoFocus}
            disabled={disabled}
            autoComplete="one-time-code"
            error={Boolean(error)}
            helperText={error || 'Check your Mailtrap inbox for the code'}
            fullWidth
            slotProps={{
                htmlInput: {
                    inputMode: 'numeric',
                    maxLength: OTP_LENGTH,
                    'aria-label': '6-digit verification code',
                    style: { fontSize: 26, fontWeight: 700, letterSpacing: '0.45em', textAlign: 'center', fontFamily: 'Consolas, Menlo, monospace' }
                }
            }}
        />
    )
}

// onResend must return a promise; the countdown restarts after it succeeds.
export function ResendCode({ onResend, seconds = 30 }) {
    const [left, setLeft] = useState(seconds)
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        if (left <= 0) return undefined
        const t = setTimeout(() => setLeft((n) => n - 1), 1000)
        return () => clearTimeout(t)
    }, [left])

    const click = async () => {
        setBusy(true)
        try {
            await onResend()
            toast.success('A new code was sent')
            setLeft(seconds)
        } catch (err) {
            toast.error(getErrorMessage(err))
        }
        setBusy(false)
    }

    return (
        <Button onClick={click} disabled={left > 0 || busy} size="small" color="primary">
            {busy ? 'Sending…' : left > 0 ? `Resend code in ${left}s` : 'Resend code'}
        </Button>
    )
}

// A complete "enter your code" step.
//   email     where the code was sent (shown to the user)
//   onConfirm (code) => Promise  — throw to show the error under the field
//   onResend  () => Promise
//   onBack    optional: shows a "Use a different email" style link
export default function OtpPanel({ email, confirmLabel = 'Verify', busyLabel = 'Verifying…', onConfirm, onResend, onBack, backLabel = 'Back', children }) {
    const [code, setCode] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const mounted = useRef(true)
    useEffect(() => () => { mounted.current = false }, [])

    const submit = async (e) => {
        e.preventDefault()
        if (code.length !== OTP_LENGTH) return setError('Enter the 6-digit code from your email')
        setError('')
        setBusy(true)
        try {
            await onConfirm(code)
        } catch (err) {
            if (mounted.current) {
                setError(getErrorMessage(err))
                setBusy(false)
            }
            return
        }
        if (mounted.current) setBusy(false)
    }

    return (
        <Stack component="form" spacing={2} onSubmit={submit} noValidate>
            <Alert severity="info" icon={false}>
                We sent a 6-digit code to <b>{email}</b>. It expires in 5 minutes.
            </Alert>
            {children}
            <OtpCodeField value={code} onChange={(v) => { setCode(v); setError('') }} error={error} disabled={busy} />
            <Button type="submit" variant="contained" size="large" disabled={busy || code.length !== OTP_LENGTH}>
                {busy ? busyLabel : confirmLabel}
            </Button>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {onBack ? <Button size="small" color="inherit" onClick={onBack} disabled={busy}>{backLabel}</Button> : <span />}
                <ResendCode onResend={onResend} />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                Never share this code with anyone.
            </Typography>
        </Stack>
    )
}
