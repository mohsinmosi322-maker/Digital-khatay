import { useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency, getCustomerStats, clearAllData, loadBusiness } from '../utils/storage'

export default function Dashboard() {
  const { customers, globalStats, business, dispatch } = useApp()
  const fileRef = useRef(null)
  const [biz, setBiz] = useState(business)

  const topPending = [...customers]
    .map((c) => ({ name: c.name, phone: c.phone, ...getCustomerStats(c) }))
    .filter((c) => c.pending > 0)
    .sort((a, b) => b.pending - a.pending)
    .slice(0, 10)

  const handleBackup = () => {
    const data = JSON.stringify(
      { customers, business, exportedAt: new Date().toISOString() },
      null,
      2
    )
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `khata-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    dispatch({ type: 'TOAST', payload: { type: 'success', message: 'Backup downloaded' } })
  }

  const handleRestore = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const list = Array.isArray(data) ? data : data.customers
      if (!Array.isArray(list)) throw new Error('Invalid backup')
      dispatch({
        type: 'RESTORE_ALL',
        payload: { customers: list, business: data.business || loadBusiness() },
      })
    } catch {
      alert('Invalid backup file')
    }
    e.target.value = ''
  }

  const saveBusiness = () => {
    dispatch({ type: 'SET_BUSINESS', payload: biz })
    dispatch({ type: 'TOAST', payload: { type: 'success', message: 'Business profile saved' } })
  }

  return (
    <div style={{ padding: 16, height: '100%', overflowY: 'auto', background: 'var(--bg)' }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Dashboard</h2>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
          Business overview, outstanding accounts & data tools
        </p>
      </div>

      {/* KPI cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 12,
        marginBottom: 18
      }}>
        {[
          ['Customers', globalStats.count, 'var(--primary)'],
          ['Total Debit', formatCurrency(globalStats.totalAmount, true), 'var(--primary)'],
          ['Received', formatCurrency(globalStats.totalReceived, true), 'var(--success)'],
          ['Outstanding', formatCurrency(globalStats.pending, true), 'var(--danger)'],
        ].map(([label, val, color]) => (
          <div key={label} className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 4 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Top outstanding */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Top Outstanding</h3>
        {topPending.length === 0 ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', margin: '18px 0' }}>
            All accounts settled
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 480 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontSize: 11 }}>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>#</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Customer</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Phone</th>
                  <th style={{ textAlign: 'right', padding: 8 }}>Pending</th>
                </tr>
              </thead>
              <tbody>
                {topPending.map((c, i) => (
                  <tr key={c.name} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 0', color: 'var(--muted)' }}>{i + 1}</td>
                    <td style={{ padding: 8, fontWeight: 700 }}>{c.name}</td>
                    <td style={{ padding: 8, color: 'var(--muted)' }}>{c.phone || '—'}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontWeight: 800, color: 'var(--danger)' }}>
                      {formatCurrency(c.pending)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Business + Backup */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 14
      }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Business Profile</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            <input className="input" placeholder="Shop / Business name"
              value={biz.name || ''} onChange={(e) => setBiz({ ...biz, name: e.target.value })} />
            <input className="input" placeholder="Phone"
              value={biz.phone || ''} onChange={(e) => setBiz({ ...biz, phone: e.target.value })} />
            <input className="input" placeholder="Address"
              value={biz.address || ''} onChange={(e) => setBiz({ ...biz, address: e.target.value })} />
            <button className="btn btn-primary" onClick={saveBusiness}>Save Profile</button>
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800 }}>Backup & Data</h3>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--muted)', lineHeight: 1.45 }}>
            Data is stored in this browser only. Download backup regularly so data safe rahe.
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleBackup}>
              Download Backup (JSON)
            </button>
            <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleRestore} />
            <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
              Restore from Backup
            </button>
            <button
              className="btn btn-danger-outline"
              onClick={() => {
                if (window.confirm('Delete ALL data? Take backup first!')) {
                  clearAllData()
                  dispatch({ type: 'CLEAR_ALL' })
                }
              }}
            >
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
