import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

// Google sign-in via Firebase. Fill the VITE_FIREBASE_* values in frontend/.env
// (see STARTUP_GUIDE.md). If they're empty, the Google button is simply hidden.
const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
}

export const isFirebaseConfigured = Boolean(config.apiKey && config.authDomain && config.projectId)

const auth = isFirebaseConfigured ? getAuth(initializeApp(config)) : null

// Opens the Google popup and returns a Firebase ID token for the backend to verify.
export async function signInWithGoogle() {
    const result = await signInWithPopup(auth, new GoogleAuthProvider())
    return result.user.getIdToken()
}
