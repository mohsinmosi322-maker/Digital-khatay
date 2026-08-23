import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Sidebar from './components/Sidebar'
import Ledger from './components/Ledger'
import Dashboard from './components/Dashboard'

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

      <Toast />
    </div>
  )
}
function Toast() {
  const { toast } = useApp()
  if (!toast) return null

  const bg =
    toast.type === 'success'
      ? '#2f6b12'
      : toast.type === 'danger'
        ? '#d93b3a'
        : '#185FA5'

  return (
    <div
      className="no-print"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.35)',
      }}
    >
      <div
        style={{
          minWidth: 240,
          maxWidth: '90vw',
          padding: '18px 32px',
          borderRadius: 16,
          background: bg,
          color: '#ffffff',
          fontWeight: 800,
          fontSize: 16,
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
          border: '2px solid rgba(255,255,255,0.25)',
        }}
      >
        {toast.message}
      </div>
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
