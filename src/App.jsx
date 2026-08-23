import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Sidebar from './components/Sidebar'
import Ledger from './components/Ledger'
import Dashboard from './components/Dashboard'

function Toast() {
  const { toast } = useApp()
  if (!toast) return null
  const cls =
    toast.type === 'success' ? 'toast toast-success' :
    toast.type === 'danger' ? 'toast toast-danger' :
    'toast toast-info'
  return (
    <div className="toast-wrap no-print">
      <div className={cls}>{toast.message}</div>
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

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
