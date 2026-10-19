import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { toast } from 'react-toastify'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import api, { getErrorMessage } from '../../api'
import { authenticate, readFileAsDataUrl, checkImageFile } from '../../Utils/helpers'
import { registerSchema } from '../../Utils/validation'
import FormField from '../Common/FormField'
import MetaData from '../Layout/MetaData'
import AuthCard from './AuthCard'
import GoogleButton from './GoogleButton'

export default function Register() {
    const navigate = useNavigate()
    const [params] = useSearchParams()
    const redirect = params.get('redirect')
    const goNext = () => navigate(redirect ? `/${redirect}` : '/', { replace: true })
    const [avatar, setAvatar] = useState('')

    const { control, handleSubmit, formState: { isSubmitting } } = useForm({
        resolver: yupResolver(registerSchema),
        defaultValues: { name: '', email: '', password: '', confirmPassword: '' }
    })

    const pickAvatar = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        const problem = checkImageFile(file)
        if (problem) return toast.error(problem)
        setAvatar(await readFileAsDataUrl(file))
    }

    const onSubmit = async ({ name, email, password }) => {
        try {
            const { data } = await api.post('/register', { name, email, password, avatar })
            authenticate(data, () => {
                toast.success('Your account is ready!')
                goNext()
            })
        } catch (err) {
            toast.error(getErrorMessage(err))
        }
    }

    return (
        <AuthCard title="Create account" subtitle="Shop faster and track your orders.">
            <MetaData title="Create account" />
            <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)} noValidate>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={avatar} sx={{ width: 56, height: 56, bgcolor: 'primary.main' }} />
                    <Button component="label" variant="outlined" size="small">
                        {avatar ? 'Change photo' : 'Add photo (optional)'}
                        <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={pickAvatar} />
                    </Button>
                </Box>
                <FormField name="name" control={control} label="Full name" autoComplete="name" />
                <FormField name="email" control={control} label="Email" type="email" autoComplete="email" />
                <FormField name="password" control={control} label="Password" type="password" autoComplete="new-password" helperText="At least 6 characters" />
                <FormField name="confirmPassword" control={control} label="Confirm password" type="password" autoComplete="new-password" />
                <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating account…' : 'Create account'}
                </Button>
            </Stack>
            <GoogleButton onSuccess={goNext} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
                Already have an account? <Typography component={Link} to="/login" variant="body2" color="primary" sx={{ fontWeight: 600 }}>Log in</Typography>
            </Typography>
        </AuthCard>
    )
}
