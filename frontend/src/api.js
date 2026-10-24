import axios from 'axios'
import { getToken } from './Utils/helpers'

// One axios instance for the whole app.
// withCredentials: send the httpOnly session cookie to the API, even though the
// API lives on a different domain (a separate Render Web Service).
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true
})

// Fallback for browsers that block cross-site cookies (e.g. Safari): also send
// the token as a Bearer header. The cookie remains the primary session.
api.interceptors.request.use((config) => {
    const token = getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Pull a readable message out of any failed request.
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
    if (error.response && error.response.data && error.response.data.message) {
        return error.response.data.message
    }
    if (error.request && !error.response) {
        return 'Cannot reach the server. Is the backend running? (On Render\'s free tier the API may take ~1 minute to wake up.)'
    }
    return fallback
}

export default api
