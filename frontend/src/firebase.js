import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from 'firebase/auth'

// Google and Facebook sign-in via Firebase Authentication. Fill the
// VITE_FIREBASE_* values in frontend/.env (see README). If they're empty, the
// social buttons are simply hidden.
// Firebase is used only to prove who the user is: the ID token it returns is
// sent once to the API, which then starts the app's own JWT cookie session.
const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
}

export const isFirebaseConfigured = Boolean(config.apiKey && config.authDomain && config.projectId)

const auth = isFirebaseConfigured ? getAuth(initializeApp(config)) : null

const createProvider = (name) => {
    if (name === 'facebook') {
        const provider = new FacebookAuthProvider()
        provider.addScope('email') // the API needs an email to find/create the account
        return provider
    }
    return new GoogleAuthProvider()
}

// Opens the Google or Facebook popup and returns a Firebase ID token for the backend to verify.
export async function signInWithProvider(name) {
    const result = await signInWithPopup(auth, createProvider(name))
    return result.user.getIdToken()
}
