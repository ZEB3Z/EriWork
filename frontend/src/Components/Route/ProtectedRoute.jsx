import { Navigate, useLocation } from 'react-router-dom'
import { getUser } from '../../Utils/helpers'

// Sends guests to the login page (and back here afterwards). Admin-only pages need isAdmin.
export default function ProtectedRoute({ children, isAdmin = false }) {
    const location = useLocation()
    const user = getUser()

    if (!user) {
        const back = encodeURIComponent(location.pathname.slice(1))
        return <Navigate to={`/login?redirect=${back}`} replace />
    }
    if (isAdmin && user.role !== 'admin') {
        return <Navigate to="/" replace />
    }
    return children
}
