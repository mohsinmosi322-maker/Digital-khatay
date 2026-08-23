import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Sidebar from './components/Sidebar'
import Ledger from './components/Ledger'
import Dashboard from './components/Dashboard'

function AnimatedFeedback() {
  const { toast } = useApp()
  if (!toast) return null

  const isSuccess = toast.type === 'success'
  const bg = isSuccess ? '#2f6b12' : '#d93b3a'

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
          animation: 'popIn 0.35s ease',
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
            animation: 'scaleIn 0.4s ease',
          }}
        >
          {isSuccess ? (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="#fff"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="#fff"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
        <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>{toast.message}</div>
      </div>
      <style>{`
        @keyframes scaleIn {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes popIn {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function AppShell() {
  const { view, loaded, business } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!loaded) {
    return (
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              margin: '0 auto 12px',
              background: 'linear-gradient(135deg, #185FA5, #3B82F6)',
            }}
          />
          <div style={{ fontWeight: 700 }}>Digital Khata</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Loading…</div>
        </div>
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
          <div style={{ fontWeight: 700, fontSize: 14 }}>{business?.name || 'Digital Khata'}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Debit & Recovery</div>
        </div>
      </header>

      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main className="main-panel">
        {view === 'dashboard' ? <Dashboard /> : <Ledger />}
      </main>

      <AnimatedFeedback />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
