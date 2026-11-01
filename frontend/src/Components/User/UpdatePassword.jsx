import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { toast } from 'react-toastify'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { getErrorMessage } from '../../api'
import { updatePassword } from '../../redux/actions/authActions'
import { changePasswordSchema } from '../../Utils/validation'
import FormField from '../Common/FormField'
import { OtpCodeField, ResendCode } from '../Common/OtpPanel'
import { sendActionOtp, OTP_LENGTH } from '../../Utils/otp'
import MetaData from '../Layout/MetaData'
import AuthCard from './AuthCard'

// Changing your password needs a 6-digit code sent to your account email.
export default function UpdatePassword() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const user = useSelector((state) => state.auth.user)
    const [values, setValues] = useState(null) // the validated form, kept while we wait for the code
    const [code, setCode] = useState('')
    const [codeError, setCodeError] = useState('')
    const [busy, setBusy] = useState(false)

    const { control, handleSubmit, formState: { isSubmitting } } = useForm({
        resolver: yupResolver(changePasswordSchema),
        defaultValues: { oldPassword: '', password: '', confirmPassword: '' }
    })

    // Step 1: form is valid -> email a code.
    const onSubmit = async (form) => {
        try {
            await sendActionOtp('password')
            setValues(form)
            toast.info('Check your email for the 6-digit code')
        } catch (err) {
            toast.error(getErrorMessage(err))
        }
    }

    // Step 2: send the new password together with the code.
    const confirm = async (e) => {
        e.preventDefault()
        if (code.length !== OTP_LENGTH) return setCodeError('Enter the 6-digit code from your email')
        setBusy(true)
        try {
            await dispatch(updatePassword({ oldPassword: values.oldPassword, password: values.password, otp: code })) // the server returns a fresh token
            toast.success('Password changed')
            navigate('/me')
        } catch (err) {
            setCodeError(getErrorMessage(err))
            setBusy(false)
        }
    }

    if (values) {
        return (
            <AuthCard title="Confirm password change" subtitle="Enter the code we emailed you.">
                <MetaData title="Confirm password change" noIndex />
                <Stack component="form" spacing={2} onSubmit={confirm} noValidate>
                    <Alert severity="info" icon={false}>We sent a 6-digit code to <b>{user && user.email}</b>. It expires in 5 minutes.</Alert>
                    <OtpCodeField value={code} onChange={(v) => { setCode(v); setCodeError('') }} error={codeError} disabled={busy} />
                    <Button type="submit" variant="contained" size="large" disabled={busy || code.length !== OTP_LENGTH}>
                        {busy ? 'Saving…' : 'Confirm and update password'}
                    </Button>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Button size="small" color="inherit" onClick={() => { setValues(null); setCode(''); setCodeError('') }}>Back</Button>
                        <ResendCode onResend={() => sendActionOtp('password')} />
                    </Box>
                </Stack>
            </AuthCard>
        )
    }

    return (
        <AuthCard title="Change password">
            <MetaData title="Change password" noIndex />
            <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)} noValidate>
                <FormField name="oldPassword" control={control} label="Current password" type="password" autoComplete="current-password" />
                <FormField name="password" control={control} label="New password" type="password" autoComplete="new-password" helperText="At least 6 characters" />
                <FormField name="confirmPassword" control={control} label="Confirm new password" type="password" autoComplete="new-password" />
                <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending code…' : 'Continue'}
                </Button>
                <Button onClick={() => navigate('/me')} color="inherit">Cancel</Button>
            </Stack>
        </AuthCard>
    )
}
