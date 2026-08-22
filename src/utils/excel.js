/**
 * Excel import / export utilities using SheetJS (xlsx)
 */
import * as XLSX from 'xlsx';
import { generateId, getCustomerStats } from './storage';

/**
 * Expected columns (case-insensitive, flexible matching):
 * - Customer Name / Name / Customer
 * - Date / Bill Date
 * - Bill No / Bill / Invoice
 * - Amount / Debit / Total
 * - Received / Payment / Credit
 * - Received Date / Payment Date
 */
const COLUMN_MAP = {
  name: ['customer name', 'customer', 'name', 'party', 'party name'],
  date: ['date', 'bill date', 'txn date', 'transaction date'],
  billNo: ['bill no', 'bill', 'invoice', 'invoice no', 'bill number', 'inv'],
  amount: ['amount', 'debit', 'total', 'bill amount', 'dr'],
  received: ['received', 'payment', 'credit', 'cr', 'paid', 'received amount'],
  receivedDate: ['received date', 'payment date', 'paid date', 'receive date'],
};

function normalizeHeader(h) {
  return String(h || '').trim().toLowerCase();
}

function findColumnIndex(headers, keys) {
  for (const key of keys) {
    const idx = headers.findIndex((h) => normalizeHeader(h) === key || normalizeHeader(h).includes(key));
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Parse an uploaded Excel/CSV file into Customer[] structure
 * @param {File} file
 * @returns {Promise<{customers: import('./storage').Customer[], errors: string[]}>}
 */
export async function parseExcelFile(file) {
  const errors = [];
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { customers: [], errors: ['No sheets found in the file.'] };
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });

  if (rows.length < 2) {
    return { customers: [], errors: ['File has no data rows.'] };
  }

  const headers = rows[0].map(normalizeHeader);
  const col = {
    name: findColumnIndex(headers, COLUMN_MAP.name),
    date: findColumnIndex(headers, COLUMN_MAP.date),
    billNo: findColumnIndex(headers, COLUMN_MAP.billNo),
    amount: findColumnIndex(headers, COLUMN_MAP.amount),
    received: findColumnIndex(headers, COLUMN_MAP.received),
    receivedDate: findColumnIndex(headers, COLUMN_MAP.receivedDate),
  };

  if (col.name === -1) {
    errors.push('Could not find "Customer Name" column. Please include a column named Customer / Name / Party.');
  }
  if (col.amount === -1 && col.received === -1) {
    errors.push('Could not find Amount or Received columns.');
  }

  if (errors.length) {
    return { customers: [], errors };
  }

  /** @type {Map<string, import('./storage').Customer>} */
  const map = new Map();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => c === '' || c == null)) continue;

    const name = String(row[col.name] || '').trim();
    if (!name) {
      errors.push(`Row ${i + 1}: missing customer name – skipped.`);
      continue;
    }

    const parseNum = (v) => {
      if (v == null || v === '') return 0;
      const n = Number(String(v).replace(/[^\d.-]/g, ''));
      return isNaN(n) ? 0 : n;
    };

    const parseDate = (v) => {
      if (!v) return null;
      if (v instanceof Date) return v.toISOString().slice(0, 10);
      // Excel serial number
      if (typeof v === 'number') {
        const d = XLSX.SSF.parse_date_code(v);
        if (d) {
          return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
        }
      }
      const s = String(v).trim();
      // Try DD/MM/YYYY or YYYY-MM-DD
      const m = s.match(/(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{1,4})/);
      if (m) {
        let [, a, b, c] = m;
        if (a.length === 4) return `${a}-${b.padStart(2, '0')}-${c.padStart(2, '0')}`;
        // assume DD/MM/YYYY
        return `${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
      }
      try {
        const d = new Date(s);
        if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      } catch { /* ignore */ }
      return null;
    };

    const tx = {
      id: generateId(),
      date: parseDate(col.date !== -1 ? row[col.date] : null) || new Date().toISOString().slice(0, 10),
      billNo: col.billNo !== -1 ? String(row[col.billNo] || '').trim() : '',
      amount: col.amount !== -1 ? parseNum(row[col.amount]) : 0,
      received: col.received !== -1 ? parseNum(row[col.received]) : 0,
      receivedDate: col.receivedDate !== -1 ? parseDate(row[col.receivedDate]) : null,
    };

    if (!map.has(name)) {
      map.set(name, {
        id: generateId(),
        name,
        transactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    map.get(name).transactions.push(tx);
  }

  const customers = Array.from(map.values()).map((c) => {
    c.transactions.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    c.updatedAt = new Date().toISOString();
    return c;
  });

  return { customers, errors };
}

/**
 * Export customers to CSV string
 * @param {import('./storage').Customer[]} customers
 * @param {string|null} [customerId] - if set, export only that customer
 */
export function exportToCSV(customers, customerId = null) {
  const list = customerId
    ? customers.filter((c) => c.id === customerId)
    : customers;

  const headers = [
    'Customer Name',
    'Date',
    'Bill No',
    'Amount',
    'Received',
    'Received Date',
    'Pending (row)',
  ];

  const rows = [headers.join(',')];

  for (const customer of list) {
    for (const tx of customer.transactions) {
      const pending = (Number(tx.amount) || 0) - (Number(tx.received) || 0);
      const line = [
        `"${customer.name.replace(/"/g, '""')}"`,
        tx.date || '',
        `"${(tx.billNo || '').replace(/"/g, '""')}"`,
        Number(tx.amount) || 0,
        Number(tx.received) || 0,
        tx.receivedDate || '',
        pending,
      ].join(',');
      rows.push(line);
    }
  }

  // Summary section
  rows.push('');
  rows.push('Summary');
  rows.push('Customer Name,Total Amount,Total Received,Pending,Transaction Count');
  for (const customer of list) {
    const stats = getCustomerStats(customer);
    rows.push(
      [
        `"${customer.name.replace(/"/g, '""')}"`,
        stats.totalAmount,
        stats.totalReceived,
        stats.pending,
        stats.txCount,
      ].join(',')
    );
  }

  return rows.join('\n');
}

/**
 * Trigger browser download of a string as a file
 */
export function downloadFile(content, filename, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export full data as JSON backup
 */
export function exportJSON(customers) {
  return JSON.stringify(customers, null, 2);
}
