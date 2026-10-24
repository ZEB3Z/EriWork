import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import GoogleIcon from '@mui/icons-material/Google'
import FacebookIcon from '@mui/icons-material/Facebook'
import { getErrorMessage } from '../../api'
import { isFirebaseConfigured } from '../../firebase'
import { socialLogin } from '../../redux/actions/authActions'

const PROVIDERS = [
    { id: 'google', label: 'Google', icon: <GoogleIcon /> },
    { id: 'facebook', label: 'Facebook', icon: <FacebookIcon sx={{ color: '#1877F2' }} /> }
]

// Firebase popup errors that deserve a specific message.
const firebaseMessage = (err, label) => {
    switch (err.code) {
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request':
            return null // closing the popup isn't an error worth showing
        case 'auth/popup-blocked':
            return 'Your browser blocked the sign-in popup. Allow popups for this site and try again.'
        case 'auth/operation-not-allowed':
            return `${label} sign-in isn't enabled yet. Turn it on in Firebase console > Authentication > Sign-in method.`
        case 'auth/unauthorized-domain':
            return 'This website address is not authorized in Firebase. Add it under Authentication > Settings > Authorized domains.'
        case 'auth/account-exists-with-different-credential':
            return 'You already signed in with this email using a different method (e.g. Google). Use that one instead.'
        default:
            return `${label} sign-in failed. Please try again.`
    }
}

// "Continue with Google" / "Continue with Facebook" — hidden until Firebase keys are added to frontend/.env.
export default function SocialLoginButtons({ onSuccess }) {
    const dispatch = useDispatch()
    const [loading, setLoading] = useState(null) // which provider is busy
    if (!isFirebaseConfigured) return null

    const handleClick = async ({ id, label }) => {
        setLoading(id)
        try {
            const data = await dispatch(socialLogin(id))
            toast.success(`Welcome, ${data.user.name}!`)
            onSuccess()
        } catch (err) {
            const message = err.response ? getErrorMessage(err) : firebaseMessage(err, label)
            if (message) toast.error(message)
        } finally {
            setLoading(null)
        }
    }

    return (
        <>
            <Divider sx={{ my: 2.5, color: 'text.secondary', fontSize: 13 }}>or</Divider>
            <Stack spacing={1.25}>
                {PROVIDERS.map((p) => (
                    <Button key={p.id} fullWidth variant="outlined" size="large" startIcon={p.icon}
                        onClick={() => handleClick(p)} disabled={Boolean(loading)}
                        sx={{ color: 'text.primary', borderColor: 'divider' }}>
                        {loading === p.id ? 'Signing in…' : `Continue with ${p.label}`}
                    </Button>
                ))}
            </Stack>
        </>
    )
}
