import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

function friendlyError(e) {
  const code = e?.code || ''
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-email'
  ) {
    return 'Invalid username/email or password.'
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Try again later.'
  }
  return e?.message || 'Login failed. Try again.'
}

async function loadUserProfile(uid) {
  return getDoc(doc(db, 'users', uid))
}

/** Resolve login id (username or email) → auth email */
export async function resolveLoginEmail(loginId) {
  const raw = (loginId || '').trim()
  if (!raw) return null
  if (raw.includes('@')) return raw.toLowerCase()

  const key = raw.toLowerCase()
  // Preferred: usernames/{username} map
  try {
    const uSnap = await getDoc(doc(db, 'usernames', key))
    if (uSnap.exists() && uSnap.data()?.email) {
      return String(uSnap.data().email).toLowerCase()
    }
  } catch (_) {}

  return null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser)
      if (fbUser) {
        try {
          const snap = await loadUserProfile(fbUser.uid)
          if (snap.exists()) {
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
          } else {
            setProfile(null)
          }
        } catch (e) {
          console.error(e)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const login = async (loginId, password) => {
    setAuthError('')
    try {
      let email = (loginId || '').trim()
      if (!email.includes('@')) {
        const resolved = await resolveLoginEmail(email)
        if (!resolved) {
          setAuthError('Username not found. Use correct username or email.')
          return false
        }
        email = resolved
      } else {
        email = email.toLowerCase()
      }

      const cred = await signInWithEmailAndPassword(auth, email, password)
      const snap = await loadUserProfile(cred.user.uid)
      if (!snap.exists()) {
        await signOut(auth)
        setAuthError('Account not found. Contact admin.')
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
          email,
          username: data.username || '',
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
