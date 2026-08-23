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
    const data = JSON.stringify({ customers, business, exportedAt: new Date().toISOString() }, null, 2)
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
    <div style={{ padding: 24, height: '100%', overflowY: 'auto', background: '#f8fafc' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>Dashboard</h2>
      <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 14 }}>Business overview & data tools</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          ['Customers', globalStats.count, '#185FA5'],
          ['Total Debit', formatCurrency(globalStats.totalAmount, true), '#185FA5'],
          ['Received', formatCurrency(globalStats.totalReceived, true), '#3B6D11'],
          ['Outstanding', formatCurrency(globalStats.pending, true), '#E24B4A'],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 4 }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15 }}>Top Outstanding</h3>
        {topPending.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>All settled</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 11 }}>
                <th style={{ textAlign: 'left', padding: '8px 0' }}>#</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Customer</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Phone</th>
                <th style={{ textAlign: 'right', padding: 8 }}>Pending</th>
              </tr>
            </thead>
            <tbody>
              {topPending.map((c, i) => (
                <tr key={c.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 0', color: '#94a3b8' }}>{i + 1}</td>
                  <td style={{ padding: 8, fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: 8, color: '#64748b' }}>{c.phone || '—'}</td>
                  <td style={{ padding: 8, textAlign: 'right', fontWeight: 700, color: '#E24B4A' }}>{formatCurrency(c.pending)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Business Profile</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input placeholder="Shop / Business name" value={biz.name || ''} onChange={(e) => setBiz({ ...biz, name: e.target.value })}
              style={{ padding: 10, border: '1px solid #cbd5e1', borderRadius: 8 }} />
            <input placeholder="Phone" value={biz.phone || ''} onChange={(e) => setBiz({ ...biz, phone: e.target.value })}
              style={{ padding: 10, border: '1px solid #cbd5e1', borderRadius: 8 }} />
            <input placeholder="Address" value={biz.address || ''} onChange={(e) => setBiz({ ...biz, address: e.target.value })}
              style={{ padding: 10, border: '1px solid #cbd5e1', borderRadius: 8 }} />
            <button onClick={saveBusiness}
              style={{ padding: 10, background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
              Save Profile
            </button>
          </div>
        </div>

        <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>Backup & Data</h3>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b' }}>
            Data is stored in this browser only. Download backup regularly.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={handleBackup}
              style={{ padding: 10, background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
              Download Backup (JSON)
            </button>
            <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleRestore} />
            <button onClick={() => fileRef.current?.click()}
              style={{ padding: 10, background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer' }}>
              Restore from Backup
            </button>
            <button onClick={() => {
              if (window.confirm('Delete ALL data? Take backup first!')) {
                clearAllData()
                dispatch({ type: 'CLEAR_ALL' })
              }
            }} style={{ padding: 10, background: 'transparent', border: '1px solid #E24B4A', color: '#E24B4A', borderRadius: 8, cursor: 'pointer' }}>
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
