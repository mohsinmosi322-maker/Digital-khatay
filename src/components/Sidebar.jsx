import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, getCustomerStats } from '../utils/storage'

function appInitials(name) {
  const t = (name || 'App').trim()
  const parts = t.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  // CamelCase / single word e.g. KhataX -> KX or KH
  const caps = t.replace(/[^A-Za-z0-9]/g, '').match(/[A-Z]/g)
  if (caps && caps.length >= 2) return (caps[0] + caps[1]).toUpperCase()
  return t.slice(0, 2).toUpperCase()
}

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const {
    filteredCustomers,
    selectedId,
    search,
    filter,
    theme,
    view,
    globalStats,
    branding,
    dispatch,
    toggleTheme,
    reload,
  } = useApp()
  const { logout, profile } = useAuth()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', cnic: '', address: '' })
  const [logoutAsk, setLogoutAsk] = useState(false)

  const appName = branding?.appName || 'Digital Khata'
  const logo = appInitials(appName)

  const handleAdd = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    dispatch({ type: 'ADD_CUSTOMER', payload: form })
    setForm({ name: '', phone: '', cnic: '', address: '' })
    setShowAdd(false)
    setMobileOpen(false)
  }

  return (
    <aside className={`sidebar no-print ${mobileOpen ? 'open' : ''}`}>
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #185FA5, #3B82F6)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              fontSize: logo.length > 2 ? 12 : 15,
              letterSpacing: 0.5,
              boxShadow: '0 4px 12px rgba(24,95,165,0.35)',
              flexShrink: 0,
            }}
            title={appName}
          >
            {logo}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: 15,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {appName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {profile?.fullName ? profile.fullName : 'Enterprise Ledger'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 12 }}>
        <button
          className="btn"
          onClick={() => dispatch({ type: 'SET_VIEW', payload: 'ledger' })}
          style={{
            background: view === 'ledger' ? 'rgba(24,95,165,0.12)' : 'transparent',
            color: view === 'ledger' ? 'var(--primary)' : 'var(--muted)',
            border: '1px solid var(--border)',
            fontWeight: 700,
          }}
        >
          Customers
        </button>
        <button
          className="btn"
          onClick={() => {
            dispatch({ type: 'SET_VIEW', payload: 'dashboard' })
            setMobileOpen(false)
          }}
          style={{
            background: view === 'dashboard' ? 'rgba(24,95,165,0.12)' : 'transparent',
            color: view === 'dashboard' ? 'var(--primary)' : 'var(--muted)',
            border: '1px solid var(--border)',
            fontWeight: 700,
          }}
        >
          Dashboard
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 12px 12px' }}>
        <div className="card" style={{ padding: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--danger)' }}>PENDING</div>
          <div style={{ fontWeight: 800, color: 'var(--danger)', marginTop: 2, fontSize: 13 }}>
            {formatCurrency(globalStats.pending)}
          </div>
        </div>
        <div className="card" style={{ padding: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--success)' }}>RECEIVED</div>
          <div style={{ fontWeight: 800, color: 'var(--success)', marginTop: 2, fontSize: 13 }}>
            {formatCurrency(globalStats.totalReceived)}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 12px 12px', borderBottom: '1px solid var(--border)' }}>
        <input
          className="input"
          type="search"
          placeholder="Search name, phone, CNIC…"
          value={search}
          onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
        />
        <select
          className="input"
          style={{ marginTop: 8 }}
          value={filter}
          onChange={(e) => dispatch({ type: 'SET_FILTER', payload: e.target.value })}
        >
          <option value="all">All customers</option>
          <option value="pending">Pending only</option>
          <option value="settled">Settled only</option>
        </select>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredCustomers.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            No customers yet.
            <br />
            Add your first customer below.
          </div>
        ) : (
          filteredCustomers.map((c) => {
            const stats = getCustomerStats(c)
            const active = c.id === selectedId && view === 'ledger'
            return (
              <button
                key={c.id}
                onClick={() => {
                  dispatch({ type: 'SELECT', payload: c.id })
                  setMobileOpen(false)
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  padding: '12px 14px',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: active ? 'rgba(24,95,165,0.08)' : 'transparent',
                  borderLeft: active ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'background 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    flexShrink: 0,
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 800,
                    fontSize: 14,
                    background: stats.pending > 0 ? 'rgba(217,59,58,0.12)' : 'rgba(47,107,18,0.12)',
                    color: stats.pending > 0 ? 'var(--danger)' : 'var(--success)',
                  }}
                >
                  {(c.name || '?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {c.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {c.phone || `${stats.txCount} entries`}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 11,
                    color: stats.pending > 0 ? 'var(--danger)' : 'var(--success)',
                    textAlign: 'right',
                    maxWidth: 90,
                  }}
                >
                  {stats.pending > 0 ? formatCurrency(stats.pending) : 'OK'}
                </div>
              </button>
            )
          })
        )}
      </div>

      <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
        {showAdd ? (
          <form onSubmit={handleAdd} style={{ display: 'grid', gap: 8 }} className="anim-slide">
            <input
              className="input"
              required
              placeholder="Customer name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="input"
              placeholder="Phone 03xx…"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              className="input"
              placeholder="CNIC (optional)"
              value={form.cnic}
              onChange={(e) => setForm({ ...form, cnic: e.target.value })}
            />
            <input
              className="input"
              placeholder="Address (optional)"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                Add
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowAdd(true)}>
            + Add Customer
          </button>
        )}
        <button className="btn btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={toggleTheme}>
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        {typeof reload === 'function' && (
          <button className="btn btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => reload()}>
            Refresh data
          </button>
        )}
        <button
          className="btn btn-ghost"
          style={{ width: '100%', marginTop: 8, color: 'var(--danger)' }}
          onClick={() => setLogoutAsk(true)}
        >
          Logout
        </button>
      </div>

      {logoutAsk && (
        <div className="modal-backdrop" style={{ zIndex: 300 }}>
          <div className="card modal-card" style={{ width: 'min(340px, 100%)', padding: 22 }}>
            <h3 style={{ margin: '0 0 8px', fontWeight: 800 }}>Logout?</h3>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--muted)' }}>
              Kya aap logout karna chahte hain?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, background: '#d93b3a', borderColor: '#d93b3a' }}
                onClick={() => logout()}
              >
                Yes, Logout
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setLogoutAsk(false)}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
