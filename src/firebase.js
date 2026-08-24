import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  initializeFirestore,
  getFirestore,
  memoryLocalCache,
  doc,
  getDocFromServer,
} from 'firebase/firestore'

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

const settings = {
  localCache: memoryLocalCache(),
  experimentalAutoDetectLongPolling: true,
}

// Prefer named DB if console uses /databases/digital-khatay/
// Also support default "(default)"
function makeDb(databaseId) {
  try {
    if (databaseId) {
      return initializeFirestore(app, settings, databaseId)
    }
    return initializeFirestore(app, settings)
  } catch {
    return databaseId ? getFirestore(app, databaseId) : getFirestore(app)
  }
}

// Start with named DB (matches your console URL path)
export let db = makeDb('digital-khatay')

/** Call once after login if named DB fails — switches to (default) */
export async function ensureFirestoreDb() {
  try {
    // lightweight probe: settings/app may or may not exist; any server response means online
    await getDocFromServer(doc(db, 'settings', 'app')).catch((e) => {
      // permission/not-found still means we reached the server
      const code = e?.code || ''
      if (code === 'unavailable' || String(e?.message || '').includes('offline')) {
        throw e
      }
    })
    return db
  } catch {
    // fallback to default database
    db = makeDb(undefined)
    return db
  }
}

export default app
