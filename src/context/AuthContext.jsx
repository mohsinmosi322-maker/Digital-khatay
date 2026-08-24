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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // Firebase Auth user
  const [profile, setProfile] = useState(null) // Firestore users/{uid}
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
        const snap = await getDoc(doc(db, 'users', fbUser.uid))
        if (!snap.exists()) {
          await signOut(auth)
          setProfile(null)
          setAuthError('Account not found. Contact admin.')
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
        // last login
        await setDoc(
          doc(db, 'users', fbUser.uid),
          { lastLoginAt: serverTimestamp() },
          { merge: true }
        )
      } catch (e) {
        console.error(e)
        setProfile(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const login = async (email, password) => {
    setAuthError('')
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
      const snap = await getDoc(doc(db, 'users', cred.user.uid))
      if (!snap.exists()) {
        await signOut(auth)
        setAuthError('Account not found. Contact admin.')
        try {
          await addDoc(collection(db, 'loginHistory'), {
            email: email.trim(),
            userId: cred.user.uid,
            status: 'failed',
            reason: 'no_profile',
            at: serverTimestamp(),
          })
        } catch (_) {}
        return false
      }
      const data = snap.data()
      if (data.status === 'disabled') {
        await signOut(auth)
        setAuthError('Your account has been disabled. Please contact administrator.')
        try {
          await addDoc(collection(db, 'loginHistory'), {
            email: email.trim(),
            userId: cred.user.uid,
            status: 'failed',
            reason: 'disabled',
            at: serverTimestamp(),
          })
        } catch (_) {}
        return false
      }
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
      setAuthError('Invalid email or password.')
      try {
        await addDoc(collection(db, 'loginHistory'), {
          email: email.trim(),
          userId: null,
          status: 'failed',
          reason: 'invalid_credentials',
          at: serverTimestamp(),
        })
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
