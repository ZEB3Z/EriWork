import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { toast } from 'react-toastify'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import api, { getErrorMessage } from '../../api'
import { authenticate } from '../../Utils/helpers'
import { resetPasswordSchema } from '../../Utils/validation'
import FormField from '../Common/FormField'
import MetaData from '../Layout/MetaData'
import AuthCard from './AuthCard'

export default function NewPassword() {
    const { token } = useParams()
    const navigate = useNavigate()
    const { control, handleSubmit, formState: { isSubmitting } } = useForm({
        resolver: yupResolver(resetPasswordSchema),
        defaultValues: { password: '', confirmPassword: '' }
    })

    const onSubmit = async (values) => {
        try {
            const { data } = await api.put(`/password/reset/${token}`, values)
            authenticate(data, () => {
                toast.success('Password changed — you are logged in')
                navigate('/', { replace: true })
            })
        } catch (err) {
            toast.error(getErrorMessage(err))
        }
    }

    return (
        <AuthCard title="Choose a new password">
            <MetaData title="Reset password" />
            <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)} noValidate>
                <FormField name="password" control={control} label="New password" type="password" autoComplete="new-password" helperText="At least 6 characters" />
                <FormField name="confirmPassword" control={control} label="Confirm new password" type="password" autoComplete="new-password" />
                <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving…' : 'Save password'}
                </Button>
            </Stack>
        </AuthCard>
    )
}
