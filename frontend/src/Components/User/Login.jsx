import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { toast } from 'react-toastify'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { getErrorMessage } from '../../api'
import { login } from '../../redux/actions/authActions'
import { loginSchema } from '../../Utils/validation'
import FormField from '../Common/FormField'
import MetaData from '../Layout/MetaData'
import AuthCard from './AuthCard'
import SocialLoginButtons from './SocialLoginButtons'

export default function Login() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const user = useSelector((state) => state.auth.user)
    const [params] = useSearchParams()
    const redirect = params.get('redirect')
    const goNext = () => navigate(redirect ? `/${redirect}` : '/', { replace: true })

    const { control, handleSubmit, formState: { isSubmitting } } = useForm({
        resolver: yupResolver(loginSchema),
        defaultValues: { email: '', password: '' }
    })

    if (user) return <Navigate to={redirect ? `/${redirect}` : '/'} replace />

    const onSubmit = async (values) => {
        try {
            const data = await dispatch(login(values))
            toast.success(`Welcome back, ${data.user.name}!`)
            goNext()
        } catch (err) {
            toast.error(getErrorMessage(err))
        }
    }

    return (
        <AuthCard title="Log in" subtitle="Welcome back to EriWork.">
            <MetaData title="Log in" description="Log in to your EriWork account to check out faster and track your orders." />
            <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)} noValidate>
                <FormField name="email" control={control} label="Email" type="email" autoComplete="email" autoFocus />
                <FormField name="password" control={control} label="Password" type="password" autoComplete="current-password" />
                <Box sx={{ textAlign: 'right' }}>
                    <Typography component={Link} to="/password/forgot" variant="body2" color="primary">Forgot password?</Typography>
                </Box>
                <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                    {isSubmitting ? 'Logging in…' : 'Log in'}
                </Button>
            </Stack>
            <SocialLoginButtons onSuccess={goNext} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
                New to EriWork? <Typography component={Link} to={redirect ? `/register?redirect=${redirect}` : '/register'} variant="body2" color="primary" sx={{ fontWeight: 600 }}>Create an account</Typography>
            </Typography>
        </AuthCard>
    )
}
