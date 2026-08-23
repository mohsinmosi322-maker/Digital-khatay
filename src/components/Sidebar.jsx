import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency, getCustomerStats } from '../utils/storage'

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const {
    filteredCustomers, selectedId, search, filter, theme, view,
    globalStats, business, dispatch, toggleTheme,
  } = useApp()

  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', address: '' })

  const handleAdd = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    dispatch({ type: 'ADD_CUSTOMER', payload: form })
    setForm({ name: '', phone: '', address: '' })
    setShowAdd(false)
    setMobileOpen(false)
  }

  return (
    <aside style={{
      width: 300, borderRight: '1px solid #e2e8f0', display: 'flex',
      flexDirection: 'column', background: '#fff', height: '100%', flexShrink: 0
    }} className="no-print">
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 0.5 }}>DIGITAL KHATA</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#185FA5', marginTop: 2 }}>
          {business?.name || 'My Business'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, padding: 10, borderBottom: '1px solid #e2e8f0' }}>
        {['ledger', 'dashboard'].map((v) => (
          <button key={v} onClick={() => { dispatch({ type: 'SET_VIEW', payload: v }); if (v === 'dashboard') setMobileOpen(false) }}
            style={{
              flex: 1, padding: '8px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: view === v ? '#185FA515' : 'transparent', color: view === v ? '#185FA5' : '#64748b'
            }}>
            {v === 'ledger' ? 'Customers' : 'Dashboard'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 12, borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ background: '#fef2f2', padding: 10, borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: '#E24B4A', fontWeight: 600 }}>PENDING</div>
          <div style={{ fontWeight: 700, color: '#E24B4A', fontSize: 14 }}>{formatCurrency(globalStats.pending, true)}</div>
        </div>
        <div style={{ background: '#f0fdf4', padding: 10, borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: '#3B6D11', fontWeight: 600 }}>RECEIVED</div>
          <div style={{ fontWeight: 700, color: '#3B6D11', fontSize: 14 }}>{formatCurrency(globalStats.totalReceived, true)}</div>
        </div>
      </div>

      <div style={{ padding: 12, borderBottom: '1px solid #e2e8f0' }}>
        <input type="search" placeholder="Search name or phone..." value={search}
          onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
          style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
        <select value={filter} onChange={(e) => dispatch({ type: 'SET_FILTER', payload: e.target.value })}
          style={{ width: '100%', marginTop: 8, padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}>
          <option value="all">All customers</option>
          <option value="pending">Pending only</option>
          <option value="settled">Settled only</option>
        </select>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredCustomers.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No customers yet</div>
        ) : filteredCustomers.map((c) => {
          const stats = getCustomerStats(c)
          const active = c.id === selectedId && view === 'ledger'
          return (
            <button key={c.id} onClick={() => { dispatch({ type: 'SELECT', payload: c.id }); setMobileOpen(false) }}
              style={{
                width: '100%', display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                background: active ? '#185FA510' : 'transparent',
                borderLeft: active ? '3px solid #185FA5' : '3px solid transparent'
              }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 14, flexShrink: 0,
                background: stats.pending > 0 ? '#fef2f2' : '#f0fdf4',
                color: stats.pending > 0 ? '#E24B4A' : '#3B6D11'
              }}>{c.name.charAt(0).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.phone || `${stats.txCount} entries`}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 12, color: stats.pending > 0 ? '#E24B4A' : '#3B6D11' }}>
                {stats.pending > 0 ? formatCurrency(stats.pending, true) : '✓'}
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ padding: 12, borderTop: '1px solid #e2e8f0' }}>
        {showAdd ? (
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input required placeholder="Customer name *" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
            <input placeholder="Phone (03xx...)" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
            <input placeholder="Address (optional)" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={{ flex: 1, padding: 8, background: '#185FA5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Add</button>
              <button type="button" onClick={() => setShowAdd(false)}
                style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>✕</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowAdd(true)}
            style={{ width: '100%', padding: 10, background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            + Add Customer
          </button>
        )}
        <button onClick={toggleTheme}
          style={{ width: '100%', marginTop: 8, padding: 8, background: 'transparent', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
          {theme === 'dark' ? '☀ Light mode' : '🌙 Dark mode'}
        </button>
      </div>
    </aside>
  )
}

export function MobileHeader({ setMobileOpen }) {
  return null
}
