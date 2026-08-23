import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate, getCustomerStats } from '../utils/storage'
import { downloadCustomerPDF, openWhatsAppStatement } from '../utils/pdf'
import { downloadCustomerPDF, openWhatsAppText, openWhatsAppWithPDF } from '../utils/pdf'

export default function Ledger() {
  const { selectedCustomer, business, dispatch } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [entryType, setEntryType] = useState('debit')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [billNo, setBillNo] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '', cnic: '', address: '' })
  const [confirmDel, setConfirmDel] = useState(null)
  const [waOpen, setWaOpen] = useState(false)

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

  const openAdd = () => {
    setEntryType('debit')
    setAmount('')
    setDate(new Date().toISOString().slice(0, 10))
    setBillNo('')
    setShowAdd(true)
  }

const handleSave = (e) => {
  e.preventDefault()
  const num = Number(amount) || 0

  if (num <= 0) {
    dispatch({
      type: 'TOAST',
      payload: { type: 'danger', message: 'Enter a valid amount' },
    })
    return
  }

  const tx = {
    date,
    billNo: billNo.trim(),
    amount: entryType === 'debit' ? num : 0,
    received: entryType === 'recovery' ? num : 0,
    receivedDate: entryType === 'recovery' ? date : null,
  }

  dispatch({
    type: 'ADD_TRANSACTION',
    payload: { customerId: selectedCustomer.id, tx },
  })

  dispatch({
    type: 'TOAST',
    payload: {
      type: entryType === 'recovery' ? 'success' : 'danger',
      message: entryType === 'recovery' ? 'Recovery Successful' : 'Debit Entry Saved',
    },
  })

  setShowAdd(false)
}
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--card)' }}>
      {/* Header */}
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
            <button className="btn btn-success" onClick={() => setWaOpen(true)}>
            WhatsApp
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

      {/* Toolbar */}
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
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Entry
        </button>
      </div>

      {/* Table */}
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

      {/* ========== ADD ENTRY POPUP ========== */}
      {showAdd && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.5)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 200,
            padding: 16,
          }}
        >
          <form
            onSubmit={handleSave}
            className="card"
            style={{
              width: 'min(400px, 100%)',
              padding: 22,
              boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontWeight: 800, fontSize: 18 }}>Add Entry</h3>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>
                1. Select Type
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setEntryType('debit')}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: 14,
                    border: entryType === 'debit' ? '2px solid #d93b3a' : '1px solid var(--border)',
                    background: entryType === 'debit' ? 'rgba(217,59,58,0.12)' : 'var(--card)',
                    color: entryType === 'debit' ? '#d93b3a' : 'var(--muted)',
                  }}
                >
                  Debit
                </button>
                <button
                  type="button"
                  onClick={() => setEntryType('recovery')}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: 14,
                    border: entryType === 'recovery' ? '2px solid #2f6b12' : '1px solid var(--border)',
                    background: entryType === 'recovery' ? 'rgba(47,107,18,0.12)' : 'var(--card)',
                    color: entryType === 'recovery' ? '#2f6b12' : 'var(--muted)',
                  }}
                >
                  Recovery
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>
                2. Amount
              </div>
              <input
                className="input"
                type="number"
                min="0"
                step="1"
                required
                placeholder="Enter amount"
                value={amount}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault()
                }}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
                style={{ fontSize: 18, fontWeight: 700, padding: 14 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>
                  3. Date
                </div>
                <input
                  className="input"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>
                  Bill No (optional)
                </div>
                <input
                  className="input"
                  value={billNo}
                  onChange={(e) => setBillNo(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: 12, fontSize: 15 }}>
                Save
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========== EDIT CUSTOMER POPUP ========== */}
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
{waOpen && (
  <div
    className="no-print"
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15,23,42,0.5)',
      display: 'grid',
      placeItems: 'center',
      zIndex: 200,
      padding: 16,
    }}
  >
    <div className="card" style={{ width: 'min(380px, 100%)', padding: 22 }}>
      <h3 style={{ margin: '0 0 8px', fontWeight: 800 }}>Send on WhatsApp</h3>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--muted)' }}>
        Message ya PDF statement choose karein
      </p>

      <div style={{ display: 'grid', gap: 10 }}>
        <button
          className="btn btn-success"
          style={{ padding: 14, fontSize: 15 }}
          onClick={() => {
            openWhatsAppText(selectedCustomer, business)
            setWaOpen(false)
          }}
        >
          💬 Message
        </button>

        <button
          className="btn btn-primary"
          style={{ padding: 14, fontSize: 15 }}
          onClick={() => {
            openWhatsAppWithPDF(selectedCustomer, business)
            setWaOpen(false)
          }}
        >
          📄 PDF Statement
        </button>

        <button className="btn btn-ghost" onClick={() => setWaOpen(false)}>
          Cancel
        </button>
      </div>

      <p style={{ margin: '14px 0 0', fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
        PDF option: file download hoti hai + WhatsApp khulta hai. Mobile pe PDF attach karke send karein.
        (WhatsApp link sirf text bhej sakta hai, file auto-attach nahi hoti.)
      </p>
    </div>
  </div>
)}
