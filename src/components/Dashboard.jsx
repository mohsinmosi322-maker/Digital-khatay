import { useRef } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency, getCustomerStats } from '../utils/storage'

export default function Dashboard() {
  const { customers, globalStats, business, dispatch, reload } = useApp()
  const fileRef = useRef(null)

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
    dispatch({ type: 'TOAST', payload: { type: 'success', message: 'Backup Downloaded' } })
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
        payload: { customers: list, business: data.business || business },
      })
    } catch {
      alert('Invalid backup file')
    }
    e.target.value = ''
  }

  return (
    <div style={{ padding: 16, height: '100%', overflowY: 'auto', background: 'var(--bg)' }}>
      <div
        style={{
          marginBottom: 18,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Dashboard</h2>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
            Overview, outstanding accounts & backup
          </p>
        </div>
        {typeof reload === 'function' && (
          <button className="btn btn-ghost" onClick={() => reload()}>
            ↻ Refresh
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
          marginBottom: 18,
        }}
      >
        {[
          ['Customers', globalStats.count, 'var(--primary)'],
          ['Total Debit', formatCurrency(globalStats.totalAmount), 'var(--primary)'],
          ['Received', formatCurrency(globalStats.totalReceived), 'var(--success)'],
          ['Outstanding', formatCurrency(globalStats.pending), 'var(--danger)'],
        ].map(([label, val, color]) => (
          <div key={label} className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color, marginTop: 4 }}>{val}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Top Outstanding</h3>
        {topPending.length === 0 ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', margin: '18px 0' }}>All accounts settled</p>
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
                  <tr key={c.name + i} style={{ borderBottom: '1px solid var(--border)' }}>
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

      <div className="card" style={{ padding: 16, maxWidth: 420 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800 }}>Backup & Restore</h3>
        <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--muted)', lineHeight: 1.45 }}>
          Data cloud (Firestore) pe save hoti hai. Backup extra safety ke liye rakhein.
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          <button className="btn btn-primary" onClick={handleBackup}>
            Download Backup (JSON)
          </button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleRestore} />
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
            Restore from Backup
          </button>
        </div>
      </div>
    </div>
  )
}
