import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { toast } from 'react-toastify'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { getErrorMessage } from '../../api'
import { updatePassword } from '../../redux/actions/authActions'
import { changePasswordSchema } from '../../Utils/validation'
import FormField from '../Common/FormField'
import MetaData from '../Layout/MetaData'
import AuthCard from './AuthCard'

export default function UpdatePassword() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { control, handleSubmit, formState: { isSubmitting } } = useForm({
        resolver: yupResolver(changePasswordSchema),
        defaultValues: { oldPassword: '', password: '', confirmPassword: '' }
    })

    const onSubmit = async ({ oldPassword, password }) => {
        try {
            await dispatch(updatePassword({ oldPassword, password })) // the server returns a fresh token
            toast.success('Password changed')
            navigate('/me')
        } catch (err) {
            toast.error(getErrorMessage(err))
        }
    }

    return (
        <AuthCard title="Change password">
            <MetaData title="Change password" noIndex />
            <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)} noValidate>
                <FormField name="oldPassword" control={control} label="Current password" type="password" autoComplete="current-password" />
                <FormField name="password" control={control} label="New password" type="password" autoComplete="new-password" helperText="At least 6 characters" />
                <FormField name="confirmPassword" control={control} label="Confirm new password" type="password" autoComplete="new-password" />
                <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving…' : 'Update password'}
                </Button>
                <Button onClick={() => navigate('/me')} color="inherit">Cancel</Button>
            </Stack>
        </AuthCard>
    )
}
