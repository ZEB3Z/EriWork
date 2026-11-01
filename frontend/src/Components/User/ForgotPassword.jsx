import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { toast } from 'react-toastify'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import api, { getErrorMessage } from '../../api'
import { resetPassword } from '../../redux/actions/authActions'
import { forgotPasswordSchema, resetPasswordSchema } from '../../Utils/validation'
import FormField from '../Common/FormField'
import { OtpCodeField, ResendCode } from '../Common/OtpPanel'
import { OTP_LENGTH } from '../../Utils/otp'
import MetaData from '../Layout/MetaData'
import AuthCard from './AuthCard'

// Step 1: enter your email -> we email a 6-digit code.
// Step 2: enter the code and a new password -> you are logged in.
export default function ForgotPassword() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [email, setEmail] = useState('') // set once the code was sent
    const [code, setCode] = useState('')
    const [codeError, setCodeError] = useState('')

    const emailForm = useForm({ resolver: yupResolver(forgotPasswordSchema), defaultValues: { email: '' } })
    const passForm = useForm({ resolver: yupResolver(resetPasswordSchema), defaultValues: { password: '', confirmPassword: '' } })

    const sendCode = async (address) => api.post('/password/forgot', { email: address })

    const onEmail = async ({ email: address }) => {
        try {
            await sendCode(address)
            setEmail(address)
            toast.info('Check your email for the 6-digit code')
        } catch (err) {
            toast.error(getErrorMessage(err))
        }
    }

    const onReset = async ({ password, confirmPassword }) => {
        if (code.length !== OTP_LENGTH) return setCodeError('Enter the 6-digit code from your email')
        try {
            await dispatch(resetPassword({ email, otp: code, password, confirmPassword }))
            toast.success('Password changed. You are logged in.')
            navigate('/', { replace: true })
        } catch (err) {
            setCodeError(getErrorMessage(err))
        }
    }

    if (email) {
        return (
            <AuthCard title="Reset password" subtitle="Enter the code we emailed you and choose a new password.">
                <MetaData title="Reset password" noIndex />
                <Stack component="form" spacing={2} onSubmit={passForm.handleSubmit(onReset)} noValidate>
                    <Alert severity="info" icon={false}>We sent a 6-digit code to <b>{email}</b>. It expires in 5 minutes.</Alert>
                    <OtpCodeField value={code} onChange={(v) => { setCode(v); setCodeError('') }} error={codeError} />
                    <FormField name="password" control={passForm.control} label="New password" type="password" autoComplete="new-password" helperText="At least 6 characters" />
                    <FormField name="confirmPassword" control={passForm.control} label="Confirm new password" type="password" autoComplete="new-password" />
                    <Button type="submit" variant="contained" size="large" disabled={passForm.formState.isSubmitting || code.length !== OTP_LENGTH}>
                        {passForm.formState.isSubmitting ? 'Saving…' : 'Reset password'}
                    </Button>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Button size="small" color="inherit" onClick={() => { setEmail(''); setCode(''); setCodeError('') }}>Use a different email</Button>
                        <ResendCode onResend={() => sendCode(email)} />
                    </Box>
                </Stack>
            </AuthCard>
        )
    }

    return (
        <AuthCard title="Forgot password" subtitle="We'll email you a 6-digit code to reset it.">
            <MetaData title="Forgot password" noIndex />
            <Stack component="form" spacing={2} onSubmit={emailForm.handleSubmit(onEmail)} noValidate>
                <FormField name="email" control={emailForm.control} label="Email" type="email" autoComplete="email" autoFocus />
                <Button type="submit" variant="contained" size="large" disabled={emailForm.formState.isSubmitting}>
                    {emailForm.formState.isSubmitting ? 'Sending…' : 'Send code'}
                </Button>
            </Stack>
            <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
                <Typography component={Link} to="/login" variant="body2" color="primary" sx={{ fontWeight: 600 }}>Back to log in</Typography>
            </Typography>
        </AuthCard>
    )
}
