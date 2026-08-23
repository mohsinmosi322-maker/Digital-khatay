import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate, getCustomerStats } from '../utils/storage'
import { downloadCustomerPDF, openWhatsAppStatement } from '../utils/pdf'

const emptyTx = {
  date: new Date().toISOString().slice(0, 10),
  billNo: '',
  amount: '',
  received: '',
  receivedDate: '',
}

export default function Ledger() {
  const { selectedCustomer, business, dispatch } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState(emptyTx)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '', cnic: '', address: '' })
  const [confirmDel, setConfirmDel] = useState(null)

  if (!selectedCustomer) {
    return (
      <div
        style={{
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          textAlign: 'center',
          color: 'var(--muted)',
        }}
      >
        <div>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              margin: '0 auto 14px',
              background: 'rgba(24,95,165,0.1)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--primary)',
              fontWeight: 800,
              fontSize: 20,
            }}
          >
            DK
          </div>
          <h2 style={{ margin: '0 0 6px', color: 'var(--text)', fontSize: 18 }}>Select a customer</h2>
          <p style={{ margin: 0, fontSize: 13 }}>Left side se customer choose karein ya naya add karein</p>
        </div>
      </div>
    )
  }

  const stats = getCustomerStats(selectedCustomer)
  const txs = [...selectedCustomer.transactions].sort((a, b) =>
    (a.date || '').localeCompare(b.date || '')
  )

const handleAdd = (e) => {
  e.preventDefault()
  const amount = Number(addForm.amount) || 0
  const received = Number(addForm.received) || 0

  if (amount <= 0 && received <= 0) {
    dispatch({
      type: 'TOAST',
      payload: { type: 'danger', message: 'Amount or Received required' },
    })
    return
  }

  dispatch({
    type: 'ADD_TRANSACTION',
    payload: {
      customerId: selectedCustomer.id,
      tx: {
        date: addForm.date,
        billNo: addForm.billNo.trim(),
        amount,
        received,
        receivedDate: addForm.receivedDate || null,
      },
    },
  })
  setAddForm(emptyTx)
  setShowAdd(false)
}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--card)' }}>
      <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid var(--border)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
              {selectedCustomer.name}
            </h2>
            <div style={{ marginTop: 6, fontSize: 13, color: 'var(--muted)' }}>
              {selectedCustomer.phone || 'No phone'}
              {selectedCustomer.cnic ? `  ·  CNIC: ${selectedCustomer.cnic}` : ''}
            </div>
          </div>

          <div className="no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setEditForm({
                  name: selectedCustomer.name || '',
                  phone: selectedCustomer.phone || '',
                  cnic: selectedCustomer.cnic || '',
                  address: selectedCustomer.address || '',
                })
                setEditOpen(true)
              }}
            >
              Edit Customer
            </button>
            <button className="btn btn-primary" onClick={() => downloadCustomerPDF(selectedCustomer, business)}>
              PDF
            </button>
            <button className="btn btn-success" onClick={() => openWhatsAppStatement(selectedCustomer, business)}>
              WhatsApp
            </button>
            <button className="btn btn-ghost" onClick={() => window.print()}>
              Print
            </button>
            <button
              className="btn btn-danger-outline"
              onClick={() => {
                if (confirmDel === selectedCustomer.id) {
                  dispatch({ type: 'DELETE_CUSTOMER', payload: selectedCustomer.id })
                  setConfirmDel(null)
                } else {
                  setConfirmDel(selectedCustomer.id)
                  setTimeout(() => setConfirmDel(null), 3000)
                }
              }}
              style={confirmDel === selectedCustomer.id ? { background: 'var(--danger)', color: '#fff' } : {}}
            >
              {confirmDel === selectedCustomer.id ? 'Confirm?' : 'Delete'}
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 10,
            marginTop: 14,
          }}
        >
          <div style={{ background: 'rgba(24,95,165,0.08)', padding: 12, borderRadius: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>TOTAL DEBIT</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>
              {formatCurrency(stats.totalAmount)}
            </div>
          </div>
          <div style={{ background: 'rgba(47,107,18,0.08)', padding: 12, borderRadius: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)' }}>RECEIVED</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)', marginTop: 2 }}>
              {formatCurrency(stats.totalReceived)}
            </div>
          </div>
          <div style={{ background: 'rgba(217,59,58,0.08)', padding: 12, borderRadius: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)' }}>PENDING</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--danger)', marginTop: 2 }}>
              {formatCurrency(stats.pending)}
            </div>
          </div>
        </div>
      </div>

      <div
        className="no-print"
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <strong style={{ fontSize: 14 }}>Date-wise Ledger</strong>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + Add Entry
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="no-print"
          style={{ padding: 14, background: 'rgba(24,95,165,0.05)', borderBottom: '1px solid var(--border)' }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 10,
            }}
          >
            {[
              ['date', 'Date', 'date'],
              ['billNo', 'Bill No', 'text'],
              ['amount', 'Amount (Debit)', 'number'],
              ['received', 'Received', 'number'],
              ['receivedDate', 'Rec. Date', 'date'],
            ].map(([key, label, type]) => (
              <div key={key}>
                <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{label}</label>
                <input
                  className="input"
                  type={type}
                  value={addForm[key]}
                  required={key === 'date'}
                  onChange={(e) => setAddForm({ ...addForm, [key]: e.target.value })}
                  style={{ marginTop: 4 }}
                />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary">
              Save Entry
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setShowAdd(false)
                setAddForm(emptyTx)
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={{ flex: 1, overflow: 'auto' }}>
        {txs.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
            No entries yet. Click “Add Entry” to start.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
              <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  {['Date', 'Bill No', 'Amount', 'Received', 'Rec. Date', 'Balance', ''].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '11px 14px',
                        textAlign: ['Amount', 'Received', 'Balance'].includes(h) ? 'right' : 'left',
                        fontSize: 11,
                        color: 'var(--muted)',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txs.map((tx) => {
                  const bal = (Number(tx.amount) || 0) - (Number(tx.received) || 0)
                  return (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>{formatDate(tx.date)}</td>
                      <td style={{ padding: '11px 14px' }}>{tx.billNo || '—'}</td>
                      <td
                        style={{
                          padding: '11px 14px',
                          textAlign: 'right',
                          color: 'var(--primary)',
                          fontWeight: 700,
                        }}
                      >
                        {tx.amount ? formatCurrency(tx.amount) : '—'}
                      </td>
                      <td
                        style={{
                          padding: '11px 14px',
                          textAlign: 'right',
                          color: 'var(--success)',
                          fontWeight: 700,
                        }}
                      >
                        {tx.received ? formatCurrency(tx.received) : '—'}
                      </td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        {formatDate(tx.receivedDate)}
                      </td>
                      <td
                        style={{
                          padding: '11px 14px',
                          textAlign: 'right',
                          fontWeight: 800,
                          color: bal > 0 ? 'var(--danger)' : 'var(--success)',
                        }}
                      >
                        {formatCurrency(bal)}
                      </td>
                      <td className="no-print" style={{ padding: '11px 14px', textAlign: 'right' }}>
                        <button
                          onClick={() =>
                            dispatch({
                              type: 'DELETE_TRANSACTION',
                              payload: { customerId: selectedCustomer.id, txId: tx.id },
                            })
                          }
                          style={{
                            border: 'none',
                            background: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          Del
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg)', fontWeight: 800, borderTop: '2px solid var(--border)' }}>
                  <td style={{ padding: '12px 14px' }} colSpan={2}>
                    Totals
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--primary)' }}>
                    {formatCurrency(stats.totalAmount)}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--success)' }}>
                    {formatCurrency(stats.totalReceived)}
                  </td>
                  <td></td>
                  <td
                    style={{
                      padding: '12px 14px',
                      textAlign: 'right',
                      color: stats.pending > 0 ? 'var(--danger)' : 'var(--success)',
                    }}
                  >
                    {formatCurrency(stats.pending)}
                  </td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {editOpen && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 100,
            padding: 16,
          }}
        >
          <div className="card" style={{ width: 'min(420px, 100%)', padding: 18 }}>
            <h3 style={{ margin: '0 0 12px', fontWeight: 800 }}>Edit Customer</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              <input
                className="input"
                placeholder="Name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
              <input
                className="input"
                placeholder="Phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
              <input
                className="input"
                placeholder="CNIC"
                value={editForm.cnic}
                onChange={(e) => setEditForm({ ...editForm, cnic: e.target.value })}
              />
              <input
                className="input"
                placeholder="Address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  if (!editForm.name.trim()) return
                  dispatch({
                    type: 'UPDATE_CUSTOMER',
                    payload: {
                      id: selectedCustomer.id,
                      updates: { ...editForm, name: editForm.name.trim() },
                    },
                  })
                  setEditOpen(false)
                }}
              >
                Save
              </button>
              <button className="btn btn-ghost" onClick={() => setEditOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
