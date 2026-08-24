import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db, ensureFirestoreDb } from '../firebase'

const AuthContext = createContext(null)

function friendlyError(e) {
  const code = e?.code || ''
  const msg = (e?.message || '').toLowerCase()
  if (code === 'unavailable' || msg.includes('offline') || msg.includes('client is offline')) {
    return 'Cannot reach database (offline). Check internet, DevTools Network Offline OFF, and that Firestore has data in this project.'
  }
  if (code === 'permission-denied') {
    return 'Permission denied. Check Firestore rules and users/{UID} document.'
  }
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-email'
  ) {
    return 'Invalid email or password.'
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Try again later.'
  }
  return e?.message || 'Login failed. Try again.'
}

async function loadUserProfile(uid) {
  // ensure we are on a reachable DB instance
  const database = await ensureFirestoreDb()
  const ref = doc(database, 'users', uid)
  // prefer server so we don't get stuck on empty offline cache
  try {
    return await getDocFromServer(ref)
  } catch {
    return await getDoc(ref)
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser)
      if (!fbUser) {
        setProfile(null)
        setLoading(false)
        return
      }
      try {
        const snap = await loadUserProfile(fbUser.uid)
        if (!snap.exists()) {
          await signOut(auth)
          setProfile(null)
          setAuthError('Account not found. Create Firestore users/{UID} with role and status.')
          setLoading(false)
          return
        }
        const data = snap.data()
        if (data.status === 'disabled') {
          await signOut(auth)
          setProfile(null)
          setAuthError('Your account has been disabled. Please contact administrator.')
          setLoading(false)
          return
        }
        setProfile({ id: fbUser.uid, ...data })
        try {
          await setDoc(
            doc(db, 'users', fbUser.uid),
            { lastLoginAt: serverTimestamp() },
            { merge: true }
          )
        } catch (_) {}
      } catch (e) {
        console.error(e)
        setProfile(null)
        setAuthError(friendlyError(e))
        try {
          await signOut(auth)
        } catch (_) {}
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const login = async (email, password) => {
    setAuthError('')
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
      const snap = await loadUserProfile(cred.user.uid)
      if (!snap.exists()) {
        await signOut(auth)
        setAuthError('Account not found. Create Firestore users/{UID} (document ID = Auth UID).')
        return false
      }
      const data = snap.data()
      if (data.status === 'disabled') {
        await signOut(auth)
        setAuthError('Your account has been disabled. Please contact administrator.')
        return false
      }
      setProfile({ id: cred.user.uid, ...data })
      try {
        await addDoc(collection(db, 'loginHistory'), {
          email: email.trim(),
          userId: cred.user.uid,
          status: 'success',
          at: serverTimestamp(),
        })
      } catch (_) {}
      return true
    } catch (e) {
      console.error(e)
      setAuthError(friendlyError(e))
      try {
        await signOut(auth)
      } catch (_) {}
      return false
    }
  }

  const logout = async () => {
    const uid = user?.uid
    const email = user?.email
    await signOut(auth)
    setProfile(null)
    if (uid) {
      try {
        await addDoc(collection(db, 'loginHistory'), {
          email: email || '',
          userId: uid,
          status: 'logout',
          at: serverTimestamp(),
        })
      } catch (_) {}
    }
  }

  const isAdmin = profile?.role === 'super_admin'
  const can = (perm) => {
    if (!profile || profile.status !== 'active') return false
    if (profile.role === 'super_admin') return true
    return !!(profile.permissions && profile.permissions[perm])
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        authError,
        setAuthError,
        login,
        logout,
        isAdmin,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth within AuthProvider')
  return ctx
}
