import axios from 'axios'
import { getToken } from './Utils/helpers'

// One axios instance for the whole app. It automatically sends the login token.
const api = axios.create({ baseURL: import.meta.env.VITE_API })

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
        return 'Cannot reach the server. Is the backend running?'
    }
    return fallback
}

export default api
