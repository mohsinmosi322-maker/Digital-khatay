import { useState, useEffect } from 'react'
import { useAuth, resolveLoginEmail } from '../context/AuthContext'
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  doc,
  serverTimestamp,
  limit,
} from 'firebase/firestore'
import { sendPasswordResetEmail } from 'firebase/auth'
import { db, auth } from '../firebase'

function appInitials(name) {
  const t = (name || 'App').trim()
  const parts = t.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  const caps = t.replace(/[^A-Za-z0-9]/g, '').match(/[A-Z]/g)
  if (caps && caps.length >= 2) return (caps[0] + caps[1]).toUpperCase()
  return t.slice(0, 2).toUpperCase()
}

export default function Login() {
  const { login, authError, setAuthError } = useAuth()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState('login')
  const [info, setInfo] = useState('')
  const [resetMsg, setResetMsg] = useState(
    'Your password reset request has been sent to admin. For more information contact Admin on WhatsApp: 03099101961'
  )
  const [brand, setBrand] = useState({
    appName: 'Digital Khata',
    publisherName: '',
    publisherRemarks: '',
  })

  useEffect(() => {
    getDoc(doc(db, 'settings', 'app'))
      .then((s) => {
        if (!s.exists()) return
        const d = s.data()
        if (d.resetMessage) setResetMsg(d.resetMessage)
        setBrand({
          appName: d.appName || d.businessName || 'Digital Khata',
          publisherName: d.publisherName || '',
          publisherRemarks: d.publisherRemarks || '',
        })
      })
      .catch(() => {})
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setBusy(true)
    setInfo('')
    setAuthError('')
    try {
      await login(loginId, password)
    } finally {
      setBusy(false)
    }
  }

  const checkApproved = async (em) => {
    const q = query(
      collection(db, 'passwordResetRequests'),
      where('email', '==', em),
      limit(20)
    )
    const snap = await getDocs(q)
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    return list.some((r) => r.status === 'approved')
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    setBusy(true)
    setAuthError('')
    setInfo('')
    const raw = loginId.trim()
    if (!raw) {
      setBusy(false)
      return
    }
    try {
      let em = raw.includes('@') ? raw.toLowerCase() : await resolveLoginEmail(raw)
      if (!em) {
        setAuthError('Username/email not found.')
        setBusy(false)
        return
      }

      const approved = await checkApproved(em)
      if (approved) {
        await sendPasswordResetEmail(auth, em)
        setMode('approved')
        setInfo(
          'Admin ne request approve kar di hai. Email par password reset link bhej di gayi hai. Link se naya password set karein.'
        )
        setBusy(false)
        return
      }

      await addDoc(collection(db, 'passwordResetRequests'), {
        email: em,
        loginId: raw,
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      setInfo(resetMsg)
    } catch (err) {
      const msg = (err?.message || '').toLowerCase()
      if (msg.includes('offline')) {
        setAuthError('Cannot reach database. Check internet / Firestore setup.')
      } else if (err?.code === 'auth/user-not-found') {
        setAuthError('Is account ka koi record nahi mila.')
      } else if (err?.code === 'auth/too-many-requests') {
        setAuthError('Bohot requests. Thodi der baad try karein.')
      } else {
        setAuthError(err.message || 'Could not submit request. Try again later.')
      }
    } finally {
      setBusy(false)
    }
  }

  const resendApprovedLink = async () => {
    setBusy(true)
    setAuthError('')
    try {
      const raw = loginId.trim()
      let em = raw.includes('@') ? raw.toLowerCase() : await resolveLoginEmail(raw)
      if (!em) {
        setAuthError('Username/email not found.')
        setBusy(false)
        return
      }
      const approved = await checkApproved(em)
      if (!approved) {
        setAuthError('Abhi approve nahi hui. Admin se contact karein.')
        setBusy(false)
        return
      }
      await sendPasswordResetEmail(auth, em)
      setInfo('Reset link dubara email par bhej di gayi hai. Inbox / Spam check karein.')
    } catch (err) {
      setAuthError(err.message || 'Email bhejne mein masla.')
    } finally {
      setBusy(false)
    }
  }

  const logo = appInitials(brand.appName)

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #0f4a85 0%, #185FA5 50%, #3B82F6 100%)',
        fontFamily:
          '"Segoe UI", system-ui, -apple-system, Roboto, Arial, "Segoe UI Emoji", sans-serif',
      }}
    >
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 16 }}>
        <form
          onSubmit={mode === 'login' ? handleLogin : handleForgot}
          className="anim-pop"
          style={{
            width: 'min(400px, 100%)',
            background: '#fff',
            borderRadius: 16,
            padding: 28,
            boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                margin: '0 auto 12px',
                background: 'linear-gradient(135deg, #185FA5, #3B82F6)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
                fontSize: logo.length > 2 ? 14 : 18,
                letterSpacing: 0.5,
              }}
            >
              {logo}
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
              {brand.appName}
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b' }}>
              {mode === 'login'
                ? 'Sign in with username or email'
                : mode === 'approved'
                  ? 'Set new password via email'
                  : 'Password reset request'}
            </p>
          </div>

          {authError && (
            <div
              style={{
                background: '#fef2f2',
                color: '#d93b3a',
                padding: 12,
                borderRadius: 10,
                fontSize: 13,
                marginBottom: 12,
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              {authError}
            </div>
          )}
          {info && (
            <div
              style={{
                background: '#f0fdf4',
                color: '#2f6b12',
                padding: 12,
                borderRadius: 10,
                fontSize: 13,
                marginBottom: 12,
                fontWeight: 600,
                lineHeight: 1.45,
              }}
            >
              {info}
            </div>
          )}

          <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>
            Username or Email
          </label>
          <input
            type="text"
            required
            autoComplete="username"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            placeholder="username ya email"
            style={{
              width: '100%',
              padding: 12,
              margin: '6px 0 12px',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              fontSize: 14,
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />

          {mode === 'login' && (
            <>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: 12,
                  margin: '6px 0 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 14,
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </>
          )}

          {mode === 'approved' ? (
            <button
              type="button"
              disabled={busy}
              onClick={resendApprovedLink}
              style={{
                width: '100%',
                padding: 12,
                background: '#185FA5',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 15,
                cursor: busy ? 'wait' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {busy ? 'Please wait…' : 'Resend password reset email'}
            </button>
          ) : (
            <button
              type="submit"
              disabled={busy}
              style={{
                width: '100%',
                padding: 12,
                background: '#185FA5',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 15,
                cursor: busy ? 'wait' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {busy
                ? 'Please wait…'
                : mode === 'login'
                  ? 'Login'
                  : 'Send Request to Admin'}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'forgot' : 'login')
              setAuthError('')
              setInfo('')
            }}
            style={{
              width: '100%',
              marginTop: 12,
              background: 'none',
              border: 'none',
              color: '#185FA5',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {mode === 'login' ? 'Forgot password?' : 'Back to Login'}
          </button>

          <p style={{ margin: '16px 0 0', fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 1.45 }}>
            Login: <strong>username</strong> ya <strong>email</strong> + password
            <br />
            Accounts Admin banata hai.
          </p>
        </form>
      </div>

      <footer
        style={{
          textAlign: 'center',
          padding: '12px 16px 18px',
          color: 'rgba(255,255,255,0.85)',
          fontSize: 12,
          lineHeight: 1.45,
        }}
      >
        <div style={{ fontWeight: 700 }}>{brand.appName}</div>
        {(brand.publisherName || brand.publisherRemarks) && (
          <div style={{ marginTop: 4, opacity: 0.9 }}>
            {brand.publisherName}
            {brand.publisherName && brand.publisherRemarks ? ' · ' : ''}
            {brand.publisherRemarks}
          </div>
        )}
      </footer>
    </div>
  )
}
