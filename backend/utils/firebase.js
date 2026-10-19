// Verifies Google sign-in tokens issued by Firebase Authentication.
// Only the Firebase project ID is needed (no service-account key file),
// because verifying an ID token just checks Google's public signing keys.
const { initializeApp, getApps } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')

const firebaseConfigured = () => Boolean(process.env.FIREBASE_PROJECT_ID)

const verifyFirebaseToken = (idToken) => {
    if (getApps().length === 0) {
        initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID })
    }
    return getAuth().verifyIdToken(idToken)
}

module.exports = { verifyFirebaseToken, firebaseConfigured }
