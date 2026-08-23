import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Sidebar, { MobileHeader } from './components/Sidebar'
import Ledger from './components/Ledger'
import Dashboard from './components/Dashboard'

function Toast() {
  const { toast } = useApp()
  if (!toast) return null
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      padding: '12px 20px', borderRadius: 10, color: '#fff', fontWeight: 500,
      background: toast.type === 'success' ? '#3B6D11' : '#E24B4A',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
    }}>
      {toast.message}
    </div>
  )
}

function AppShell() {
  const { view, loaded } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!loaded) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b' }}>Loading Digital Khata…</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <MobileHeader setMobileOpen={setMobileOpen} />
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
