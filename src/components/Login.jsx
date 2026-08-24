import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { collection, addDoc, getDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export default function Login() {
  const { login, authError, setAuthError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState('login') // login | forgot
  const [info, setInfo] = useState('')
  const [resetMsg, setResetMsg] = useState(
    'Your password reset request has been sent to admin. For more information contact Admin on WhatsApp: 03099101961'
  )

  useEffect(() => {
    getDoc(doc(db, 'settings', 'app'))
      .then((s) => {
        if (s.exists() && s.data().resetMessage) setResetMsg(s.data().resetMessage)
      })
      .catch(() => {})
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setBusy(true)
    setInfo('')
    await login(email, password)
    setBusy(false)
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    setBusy(true)
    setAuthError('')
    setInfo('')
    try {
      await addDoc(collection(db, 'passwordResetRequests'), {
        email: email.trim().toLowerCase(),
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      setInfo(resetMsg)
    } catch {
      setAuthError('Could not submit request. Try again later.')
    }
    setBusy(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(135deg, #0f4a85 0%, #185FA5 50%, #3B82F6 100%)',
        padding: 16,
      }}
    >
      <form
        onSubmit={mode === 'login' ? handleLogin : handleForgot}
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
              width: 48,
              height: 48,
              borderRadius: 12,
              margin: '0 auto 10px',
              background: 'linear-gradient(135deg, #185FA5, #3B82F6)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
            }}
          >
            DK
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
            Digital Khata
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b' }}>
            {mode === 'login' ? 'Sign in to your account' : 'Password reset request'}
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

        <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%',
            padding: 12,
            margin: '6px 0 12px',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            fontSize: 14,
            boxSizing: 'border-box',
          }}
        />

        {mode === 'login' && (
          <>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Password</label>
            <input
              type="password"
              required
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
              }}
            />
          </>
        )}

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
          }}
        >
          {busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Send Request to Admin'}
        </button>

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
          }}
        >
          {mode === 'login' ? 'Forgot password?' : '← Back to Login'}
        </button>

        <p style={{ margin: '16px 0 0', fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
          Accounts are created by Admin only.
        </p>
      </form>
    </div>
  )
}
