import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore, getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBCrb7MxRFNj_qvGf-HJumbnWFXd3dskno',
  authDomain: 'digital-khatay.firebaseapp.com',
  projectId: 'digital-khatay',
  storageBucket: 'digital-khatay.firebasestorage.app',
  messagingSenderId: '934621027982',
  appId: '1:934621027982:web:82fe766fddd84b6e7833df',
  measurementId: 'G-SRPKQBIPTG',
}

// Named database (not "(default)") — matches Firebase console path
const FIRESTORE_DB_ID = 'digital-khatay'

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

let db
try {
  db = initializeFirestore(
    app,
    { experimentalForceLongPolling: true },
    FIRESTORE_DB_ID
  )
} catch {
  db = getFirestore(app, FIRESTORE_DB_ID)
}

export { db }
export default app
