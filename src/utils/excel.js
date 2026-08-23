import * as XLSX from 'xlsx'
import { generateId } from './storage'

export async function parseExcelFile(file) {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  if (rows.length < 2) return { customers: [], errors: ['No data'] }

  const headers = rows[0].map((h) => String(h || '').toLowerCase())
  const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('customer') || h.includes('party'))
  const amountIdx = headers.findIndex((h) => h.includes('amount') || h.includes('debit'))
  const receivedIdx = headers.findIndex((h) => h.includes('received') || h.includes('payment') || h.includes('credit'))
  const dateIdx = headers.findIndex((h) => h.includes('date') && !h.includes('received'))
  const billIdx = headers.findIndex((h) => h.includes('bill') || h.includes('invoice'))
  const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('mobile'))

  if (nameIdx === -1) return { customers: [], errors: ['Customer name column not found'] }

  const map = new Map()
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const name = String(row[nameIdx] || '').trim()
    if (!name) continue
    const num = (v) => Number(String(v || '0').replace(/[^\d.-]/g, '')) || 0
    const tx = {
      id: generateId(),
      date: dateIdx >= 0 && row[dateIdx] ? String(row[dateIdx]).slice(0, 10) : new Date().toISOString().slice(0, 10),
      billNo: billIdx >= 0 ? String(row[billIdx] || '') : '',
      amount: amountIdx >= 0 ? num(row[amountIdx]) : 0,
      received: receivedIdx >= 0 ? num(row[receivedIdx]) : 0,
      receivedDate: null,
    }
    if (!map.has(name)) {
      map.set(name, {
        id: generateId(),
        name,
        phone: phoneIdx >= 0 ? String(row[phoneIdx] || '') : '',
        address: '',
        transactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    map.get(name).transactions.push(tx)
  }
  return { customers: Array.from(map.values()), errors: [] }
}
