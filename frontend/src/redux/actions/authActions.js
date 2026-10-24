import * as T from '../actionTypes'
import api from '../../api'
import { setToken, clearToken } from '../../Utils/helpers'
import { signInWithProvider } from '../../firebase'

// The server sets the httpOnly session cookie. We also keep the token for the
// Bearer fallback (see api.js), then store the user in Redux.
const loggedIn = (data) => (dispatch) => {
    setToken(data.token)
    dispatch({ type: T.AUTH_LOGIN_SUCCESS, payload: data.user })
    return data
}

// On app start: "who am I?" — restores the session from the cookie.
export const loadUser = () => async (dispatch) => {
    dispatch({ type: T.AUTH_LOAD_REQUEST })
    try {
        const { data } = await api.get('/me')
        dispatch({ type: T.AUTH_LOAD_SUCCESS, payload: data.user })
        return data.user
    } catch {
        clearToken()
        dispatch({ type: T.AUTH_LOAD_FAIL })
        return null
    }
}

// Each thunk resolves with the server's response or throws the axios error,
// so forms can show their own toasts exactly as before.
export const login = (credentials) => async (dispatch) => {
    const { data } = await api.post('/login', credentials)
    return dispatch(loggedIn(data))
}

// formData: name, email, password and an optional "avatar" file (multipart).
export const register = (formData) => async (dispatch) => {
    const { data } = await api.post('/register', formData)
    return dispatch(loggedIn(data))
}

// provider: 'google' | 'facebook'. Firebase proves who the user is, then the
// API answers with the app's own JWT cookie — the same session as email login.
export const socialLogin = (provider) => async (dispatch) => {
    const idToken = await signInWithProvider(provider)
    const { data } = await api.post('/login/social', { idToken })
    return dispatch(loggedIn(data))
}

export const resetPassword = (token, values) => async (dispatch) => {
    const { data } = await api.put(`/password/reset/${token}`, values)
    return dispatch(loggedIn(data))
}

export const updatePassword = (values) => async (dispatch) => {
    const { data } = await api.put('/password/update', values)
    return dispatch(loggedIn(data)) // the server issues a fresh token
}

// formData: name, email and an optional "avatar" file (multipart).
export const updateProfile = (formData) => async (dispatch) => {
    const { data } = await api.put('/me/update', formData)
    dispatch({ type: T.AUTH_UPDATE_USER, payload: data.user })
    return data
}

// Refresh the stored user from the server (e.g. on the profile page).
export const refreshUser = () => async (dispatch) => {
    const { data } = await api.get('/me')
    dispatch({ type: T.AUTH_UPDATE_USER, payload: data.user })
    return data.user
}

export const logout = () => async (dispatch) => {
    try {
        await api.get('/logout') // clears the httpOnly cookie
    } catch {
        // Even if the server is unreachable, log out locally.
    }
    clearToken()
    dispatch({ type: T.AUTH_LOGOUT })
}
