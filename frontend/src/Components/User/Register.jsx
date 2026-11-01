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
import { register, requestRegisterOtp } from '../../redux/actions/authActions'
import { registerSchema } from '../../Utils/validation'
import FormField from '../Common/FormField'
import OtpPanel from '../Common/OtpPanel'
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
    const [pending, setPending] = useState(null) // { name, email, password } while waiting for the emailed code

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

    // Step 1: check the details and email a 6-digit code. No account is created yet.
    const onSubmit = async ({ name, email, password }) => {
        try {
            await dispatch(requestRegisterOtp({ name, email, password }))
            setPending({ name, email, password })
            toast.info('Check your email for the 6-digit code')
        } catch (err) {
            toast.error(getErrorMessage(err))
        }
    }

    // Step 2: the right code creates the account and logs you in.
    const confirmCode = async (otp) => {
        // multipart/form-data: the photo goes to Multer on the API, then to Cloudinary.
        const form = new FormData()
        form.append('name', pending.name)
        form.append('email', pending.email)
        form.append('password', pending.password)
        form.append('otp', otp)
        if (avatar) form.append('avatar', avatar.file)
        await dispatch(register(form))
        toast.success('Your account is ready!')
        goNext()
    }

    if (pending) {
        return (
            <AuthCard title="Verify your email" subtitle="One last step to create your account.">
                <MetaData title="Verify email" noIndex />
                <OtpPanel
                    email={pending.email}
                    confirmLabel="Verify and create account"
                    busyLabel="Creating account…"
                    onConfirm={confirmCode}
                    onResend={() => dispatch(requestRegisterOtp(pending))}
                    onBack={() => setPending(null)}
                    backLabel="Change my details"
                />
            </AuthCard>
        )
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
                    {isSubmitting ? 'Sending code…' : 'Create account'}
                </Button>
            </Stack>
            <SocialLoginButtons onSuccess={goNext} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
                Already have an account? <Typography component={Link} to="/login" variant="body2" color="primary" sx={{ fontWeight: 600 }}>Log in</Typography>
            </Typography>
        </AuthCard>
    )
}
