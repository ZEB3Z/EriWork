import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { toast } from 'react-toastify'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import { getErrorMessage } from '../../api'
import { checkImageFile, toUpload, releaseUpload } from '../../Utils/helpers'
import { register } from '../../redux/actions/authActions'
import { registerSchema } from '../../Utils/validation'
import FormField from '../Common/FormField'
import MetaData from '../Layout/MetaData'
import AuthCard from './AuthCard'
import SocialLoginButtons from './SocialLoginButtons'

export default function Register() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [params] = useSearchParams()
    const redirect = params.get('redirect')
    const goNext = () => navigate(redirect ? `/${redirect}` : '/', { replace: true })
    const [avatar, setAvatar] = useState(null) // { file, preview } if a photo was picked

    // Free the preview URL when it's replaced or the page closes.
    useEffect(() => () => releaseUpload(avatar), [avatar])

    const { control, handleSubmit, formState: { isSubmitting } } = useForm({
        resolver: yupResolver(registerSchema),
        defaultValues: { name: '', email: '', password: '', confirmPassword: '' }
    })

    const pickAvatar = (e) => {
        const file = e.target.files[0]
        e.target.value = ''
        if (!file) return
        const problem = checkImageFile(file)
        if (problem) return toast.error(problem)
        setAvatar(toUpload(file))
    }

    const onSubmit = async ({ name, email, password }) => {
        try {
            // multipart/form-data: the photo goes to Multer on the API, then to Cloudinary.
            const form = new FormData()
            form.append('name', name)
            form.append('email', email)
            form.append('password', password)
            if (avatar) form.append('avatar', avatar.file)
            await dispatch(register(form))
            toast.success('Your account is ready!')
            goNext()
        } catch (err) {
            toast.error(getErrorMessage(err))
        }
    }

    return (
        <AuthCard title="Create account" subtitle="Shop faster and track your orders.">
            <MetaData title="Create account" description="Create an EriWork account to shop networking gear and track your orders." />
            <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)} noValidate>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={avatar ? avatar.preview : undefined} sx={{ width: 56, height: 56, bgcolor: 'primary.main' }} />
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
            <SocialLoginButtons onSuccess={goNext} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
                Already have an account? <Typography component={Link} to="/login" variant="body2" color="primary" sx={{ fontWeight: 600 }}>Log in</Typography>
            </Typography>
        </AuthCard>
    )
}
