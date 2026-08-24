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

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// Better connectivity on some networks
let db
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  })
} catch {
  db = getFirestore(app)
}
export { db }
export default app
