import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider, useApp } from './context/AppContext'
import Sidebar from './components/Sidebar'
import Ledger from './components/Ledger'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import AdminPanel from './components/AdminPanel'

function AnimatedFeedback() {
  const { toast } = useApp()
  if (!toast) return null
  const isRed = toast.type === 'danger'
  const bg = isRed ? '#d93b3a' : toast.type === 'success' ? '#2f6b12' : '#185FA5'
  const msg = (toast.message || '').toLowerCase()
  const showCross =
    msg.includes('deleted') ||
    msg.includes('required') ||
    msg.includes('not allowed') ||
    msg.includes('invalid') ||
    msg.includes('enter a valid')

  return (
    <div
      className="no-print"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.45)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 99999,
      }}
    >
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 20,
          padding: '32px 40px',
          textAlign: 'center',
          boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
          minWidth: 220,
          maxWidth: '90vw',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            margin: '0 auto 16px',
            background: bg,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {showCross ? (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>{toast.message}</div>
      </div>
    </div>
  )
}

function KhataShell() {
  const { view, loaded, business } = useApp()
  const { profile, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!loaded) {
    return (
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
        <div style={{ fontWeight: 700, color: '#185FA5' }}>Loading Khata…</div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div
        className={`overlay ${mobileOpen ? 'show' : ''} no-print`}
        onClick={() => setMobileOpen(false)}
      />
      <header className="mobile-header no-print">
        <button className="btn btn-ghost" onClick={() => setMobileOpen(true)} style={{ padding: '8px 10px' }}>
          ☰
        </button>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            {profile?.fullName || business?.name || 'Digital Khata'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Debit & Recovery</div>
        </div>
        <button className="btn btn-ghost" style={{ marginLeft: 'auto' }} onClick={logout}>
          Logout
        </button>
      </header>
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main className="main-panel">{view === 'dashboard' ? <Dashboard /> : <Ledger />}</main>
      <AnimatedFeedback />
    </div>
  )
}

function Root() {
  const { user, profile, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center', background: '#f1f5f9' }}>
        <div style={{ fontWeight: 700, color: '#185FA5' }}>Digital Khata</div>
      </div>
    )
  }

  if (!user || !profile) return <Login />

  if (isAdmin) return <AdminPanel />

  return (
    <AppProvider>
      <KhataShell />
    </AppProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  )
}
