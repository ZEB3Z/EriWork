import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Loader from '../Layout/Loader'

// Sends guests to the login page (and back here afterwards). Admin-only pages need isAdmin.
export default function ProtectedRoute({ children, isAdmin = false }) {
    const location = useLocation()
    const { user, loading } = useSelector((state) => state.auth)

    // Still checking the session cookie (GET /me) — don't bounce to /login yet.
    if (loading) return <Loader />

    if (!user) {
        const back = encodeURIComponent(location.pathname.slice(1))
        return <Navigate to={`/login?redirect=${back}`} replace />
    }
    if (isAdmin && user.role !== 'admin') {
        return <Navigate to="/" replace />
    }
    return children
}
