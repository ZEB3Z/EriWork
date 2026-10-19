import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { toast } from 'react-toastify'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import api, { getErrorMessage } from '../../api'
import { forgotPasswordSchema } from '../../Utils/validation'
import FormField from '../Common/FormField'
import MetaData from '../Layout/MetaData'
import AuthCard from './AuthCard'

export default function ForgotPassword() {
    const [sentTo, setSentTo] = useState('')
    const { control, handleSubmit, formState: { isSubmitting } } = useForm({
        resolver: yupResolver(forgotPasswordSchema),
        defaultValues: { email: '' }
    })

    const onSubmit = async ({ email }) => {
        try {
            await api.post('/password/forgot', { email })
            setSentTo(email)
        } catch (err) {
            toast.error(getErrorMessage(err))
        }
    }

    return (
        <AuthCard title="Forgot password" subtitle="We'll email you a link to reset it.">
            <MetaData title="Forgot password" />
            {sentTo ? (
                <Alert severity="success">Check <b>{sentTo}</b> for a reset link. It's valid for 30 minutes.</Alert>
            ) : (
                <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)} noValidate>
                    <FormField name="email" control={control} label="Email" type="email" autoComplete="email" autoFocus />
                    <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                        {isSubmitting ? 'Sending…' : 'Send reset link'}
                    </Button>
                </Stack>
            )}
            <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
                <Typography component={Link} to="/login" variant="body2" color="primary" sx={{ fontWeight: 600 }}>Back to log in</Typography>
            </Typography>
        </AuthCard>
    )
}
