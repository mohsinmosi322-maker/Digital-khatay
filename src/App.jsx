import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Sidebar from './components/Sidebar'
import Ledger from './components/Ledger'
import Dashboard from './components/Dashboard'

function Toast() {
  const { toast } = useApp()
  if (!toast) return null
  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      zIndex: 100, padding: '12px 18px', borderRadius: 12, color: '#fff',
      fontWeight: 600, fontSize: 13, boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
      background: toast.type === 'success' ? '#2f6b12' : '#d93b3a'
    }}>
      {toast.message}
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
          <div style={{
            width: 42, height: 42, borderRadius: 12, margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #185FA5, #3B82F6)'
          }} />
          <div style={{ fontWeight: 700, color: 'var(--text)' }}>Digital Khata</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Loading workspace…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className={`overlay ${mobileOpen ? 'show' : ''} no-print`} onClick={() => setMobileOpen(false)} />

      <header className="mobile-header no-print">
        <button className="btn btn-ghost" onClick={() => setMobileOpen(true)} style={{ padding: '8px 10px' }}>☰</button>
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

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
