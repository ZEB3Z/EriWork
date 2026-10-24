import * as T from '../actionTypes'

// user: the logged-in user, or null.
// loading: true until the first "who am I?" check (GET /me) finishes, so
// protected pages don't bounce to /login while the session is being restored.
const initialState = { user: null, loading: true }

export default function authReducer(state = initialState, action) {
    switch (action.type) {
        case T.AUTH_LOAD_REQUEST:
            return { ...state, loading: true }
        case T.AUTH_LOAD_SUCCESS:
        case T.AUTH_LOGIN_SUCCESS:
            return { user: action.payload, loading: false }
        case T.AUTH_LOAD_FAIL:
            return { user: null, loading: false }
        case T.AUTH_UPDATE_USER:
            return { ...state, user: action.payload }
        case T.AUTH_LOGOUT:
            return { user: null, loading: false }
        default:
            return state
    }
}
