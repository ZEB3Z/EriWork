// Verifies Google / Facebook sign-in tokens issued by Firebase Authentication.
// Firebase is used ONLY at the moment of social login: once the ID token is
// verified, the app issues its own JWT cookie exactly like email/password login.
// Only the Firebase project ID is needed (no service-account key file), because
// verifying an ID token just checks Google's public signing keys.
const { initializeApp, getApps } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')

const firebaseConfigured = () => Boolean(process.env.FIREBASE_PROJECT_ID)

// Firebase sign_in_provider value -> friendly name
const SOCIAL_PROVIDERS = {
    'google.com': 'Google',
    'facebook.com': 'Facebook'
}

const verifyFirebaseToken = (idToken) => {
    if (getApps().length === 0) {
        initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID })
    }
    return getAuth().verifyIdToken(idToken)
}

module.exports = { verifyFirebaseToken, firebaseConfigured, SOCIAL_PROVIDERS }
