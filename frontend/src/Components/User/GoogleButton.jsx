import { useState } from 'react'
import { toast } from 'react-toastify'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import GoogleIcon from '@mui/icons-material/Google'
import api, { getErrorMessage } from '../../api'
import { isFirebaseConfigured, signInWithGoogle } from '../../firebase'
import { authenticate } from '../../Utils/helpers'

// "Continue with Google" — hidden until Firebase keys are added to frontend/.env.
export default function GoogleButton({ onSuccess }) {
    const [loading, setLoading] = useState(false)
    if (!isFirebaseConfigured) return null

    const handleClick = async () => {
        setLoading(true)
        try {
            const idToken = await signInWithGoogle()
            const { data } = await api.post('/login/google', { idToken })
            authenticate(data, () => {
                toast.success(`Welcome, ${data.user.name}!`)
                onSuccess()
            })
        } catch (err) {
            // Closing the popup is not an error worth showing.
            if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
                toast.error(err.response ? getErrorMessage(err) : 'Google sign-in failed. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Divider sx={{ my: 2.5, color: 'text.secondary', fontSize: 13 }}>or</Divider>
            <Button fullWidth variant="outlined" size="large" startIcon={<GoogleIcon />} onClick={handleClick} disabled={loading}
                sx={{ color: 'text.primary', borderColor: 'divider' }}>
                {loading ? 'Signing in…' : 'Continue with Google'}
            </Button>
        </>
    )
}
