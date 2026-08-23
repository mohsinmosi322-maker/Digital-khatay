import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate, getCustomerStats } from '../utils/storage'
import { downloadCustomerPDF, openWhatsAppStatement } from '../utils/pdf'

const emptyTx = {
  date: new Date().toISOString().slice(0, 10),
  billNo: '', amount: '', received: '', receivedDate: '',
}

export default function Ledger() {
  const { selectedCustomer, business, dispatch } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState(emptyTx)
  const [editPhone, setEditPhone] = useState(false)
  const [phoneVal, setPhoneVal] = useState('')
  const [confirmDel, setConfirmDel] = useState(null)

  if (!selectedCustomer) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#94a3b8' }}>
        <h2 style={{ margin: 0, color: '#64748b' }}>Select a customer</h2>
        <p>Left se customer choose karein ya naya add karein</p>
      </div>
    )
  }

  const stats = getCustomerStats(selectedCustomer)
  const txs = [...selectedCustomer.transactions].sort((a, b) => (a.date || '').localeCompare(b.date || ''))

  const handleAdd = (e) => {
    e.preventDefault()
    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        customerId: selectedCustomer.id,
        tx: {
          date: addForm.date,
          billNo: addForm.billNo.trim(),
          amount: Number(addForm.amount) || 0,
          received: Number(addForm.received) || 0,
          receivedDate: addForm.receivedDate || null,
        },
      },
    })
    setAddForm(emptyTx)
    setShowAdd(false)
  }

  const savePhone = () => {
    dispatch({
      type: 'UPDATE_CUSTOMER',
      payload: { id: selectedCustomer.id, updates: { phone: phoneVal.trim() } },
    })
    setEditPhone(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{selectedCustomer.name}</h2>
            <div style={{ marginTop: 4, fontSize: 13, color: '#64748b' }}>
              {editPhone ? (
                <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                  <input value={phoneVal} onChange={(e) => setPhoneVal(e.target.value)} placeholder="03xx-xxxxxxx"
                    style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
                  <button onClick={savePhone} style={{ padding: '4px 10px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Save</button>
                  <button onClick={() => setEditPhone(false)} style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>✕</button>
                </span>
              ) : (
                <span>
                  {selectedCustomer.phone || 'No phone'}{' '}
                  <button className="no-print" onClick={() => { setPhoneVal(selectedCustomer.phone || ''); setEditPhone(true) }}
                    style={{ border: 'none', background: 'none', color: '#185FA5', cursor: 'pointer', fontSize: 12 }}>Edit</button>
                </span>
              )}
            </div>
          </div>
          <div className="no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => downloadCustomerPDF(selectedCustomer, business)}
              style={{ padding: '8px 12px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              PDF
            </button>
            <button onClick={() => openWhatsAppStatement(selectedCustomer, business)}
              style={{ padding: '8px 12px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              WhatsApp
            </button>
            <button onClick={() => window.print()}
              style={{ padding: '8px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
              Print
            </button>
            <button onClick={() => {
              if (confirmDel === selectedCustomer.id) {
                dispatch({ type: 'DELETE_CUSTOMER', payload: selectedCustomer.id })
                setConfirmDel(null)
              } else {
                setConfirmDel(selectedCustomer.id)
                setTimeout(() => setConfirmDel(null), 3000)
              }
            }} style={{
              padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
              background: confirmDel === selectedCustomer.id ? '#E24B4A' : 'transparent',
              color: confirmDel === selectedCustomer.id ? '#fff' : '#E24B4A',
              border: '1px solid #E24B4A'
            }}>
              {confirmDel === selectedCustomer.id ? 'Confirm?' : 'Delete'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 16 }}>
          <div style={{ background: '#eff6ff', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: '#185FA5', fontWeight: 600 }}>TOTAL DEBIT</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#185FA5' }}>{formatCurrency(stats.totalAmount)}</div>
          </div>
          <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: '#3B6D11', fontWeight: 600 }}>RECEIVED</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#3B6D11' }}>{formatCurrency(stats.totalReceived)}</div>
          </div>
          <div style={{ background: '#fef2f2', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: '#E24B4A', fontWeight: 600 }}>PENDING</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#E24B4A' }}>{formatCurrency(stats.pending)}</div>
          </div>
        </div>
      </div>

      <div className="no-print" style={{ padding: '10px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: 14 }}>Date-wise Ledger</strong>
        <button onClick={() => setShowAdd(true)}
          style={{ padding: '8px 14px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          + Add Entry
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="no-print" style={{ padding: 16, background: '#f0f7ff', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {[
              ['date', 'Date', 'date'],
              ['billNo', 'Bill No', 'text'],
              ['amount', 'Amount', 'number'],
              ['received', 'Received', 'number'],
              ['receivedDate', 'Rec. Date', 'date'],
            ].map(([key, label, type]) => (
              <div key={key}>
                <label style={{ fontSize: 11, color: '#64748b' }}>{label}</label>
                <input type={type} value={addForm[key]} required={key === 'date'}
                  onChange={(e) => setAddForm({ ...addForm, [key]: e.target.value })}
                  style={{ width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="submit" style={{ padding: '8px 16px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Save</button>
            <button type="button" onClick={() => { setShowAdd(false); setAddForm(emptyTx) }}
              style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      )}

      <div style={{ flex: 1, overflow: 'auto' }}>
        {txs.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>No entries yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Date', 'Bill No', 'Amount', 'Received', 'Rec. Date', 'Balance', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Amount' || h === 'Received' || h === 'Balance' ? 'right' : 'left', fontSize: 11, color: '#64748b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txs.map((tx) => {
                const bal = (Number(tx.amount) || 0) - (Number(tx.received) || 0)
                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px' }}>{formatDate(tx.date)}</td>
                    <td style={{ padding: '10px 14px' }}>{tx.billNo || '—'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#185FA5', fontWeight: 600 }}>{tx.amount ? formatCurrency(tx.amount) : '—'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#3B6D11', fontWeight: 600 }}>{tx.received ? formatCurrency(tx.received) : '—'}</td>
                    <td style={{ padding: '10px 14px' }}>{formatDate(tx.receivedDate)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: bal > 0 ? '#E24B4A' : '#3B6D11' }}>{formatCurrency(bal)}</td>
                    <td className="no-print" style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button onClick={() => dispatch({ type: 'DELETE_TRANSACTION', payload: { customerId: selectedCustomer.id, txId: tx.id } })}
                        style={{ border: 'none', background: 'none', color: '#E24B4A', cursor: 'pointer', fontSize: 12 }}>Del</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', fontWeight: 700, borderTop: '2px solid #e2e8f0' }}>
                <td style={{ padding: '12px 14px' }} colSpan={2}>Totals</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', color: '#185FA5' }}>{formatCurrency(stats.totalAmount)}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', color: '#3B6D11' }}>{formatCurrency(stats.totalReceived)}</td>
                <td></td>
                <td style={{ padding: '12px 14px', textAlign: 'right', color: stats.pending > 0 ? '#E24B4A' : '#3B6D11' }}>{formatCurrency(stats.pending)}</td>
                <td className="no-print"></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
