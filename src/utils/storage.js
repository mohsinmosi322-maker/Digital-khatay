/**
 * LocalStorage helpers for Digital Khata
 * All data is stored client-side. Key: 'digital-khata-data'
 */

const STORAGE_KEY = 'digital-khata-data';
const THEME_KEY = 'digital-khata-theme';

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} date - ISO date string (YYYY-MM-DD)
 * @property {string} billNo
 * @property {number} amount - Debit amount
 * @property {number} received - Payment received
 * @property {string|null} receivedDate - ISO date when payment was received
 * @property {string} [note]
 */

/**
 * @typedef {Object} Customer
 * @property {string} id
 * @property {string} name
 * @property {Transaction[]} transactions
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * Load all customers from localStorage
 * @returns {Customer[]}
 */
export function loadCustomers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Failed to load data from localStorage:', err);
    return [];
  }
}

/**
 * Save customers array to localStorage
 * @param {Customer[]} customers
 */
export function saveCustomers(customers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  } catch (err) {
    console.error('Failed to save data to localStorage:', err);
    throw new Error('Storage full or unavailable. Please export your data.');
  }
}

/**
 * Clear all app data
 */
export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Theme helpers
 */
export function loadTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

/**
 * Generate a simple unique ID
 */
export function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Calculate aggregates for a customer
 * @param {Customer} customer
 */
export function getCustomerStats(customer) {
  const totalAmount = customer.transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalReceived = customer.transactions.reduce((sum, t) => sum + (Number(t.received) || 0), 0);
  const pending = totalAmount - totalReceived;
  return {
    totalAmount,
    totalReceived,
    pending: Math.max(0, pending),
    overpaid: pending < 0 ? Math.abs(pending) : 0,
    txCount: customer.transactions.length,
  };
}

/**
 * Format currency (PKR style – no decimals by default for whole rupees)
 * @param {number} value
 * @param {boolean} [compact=false]
 */
export function formatCurrency(value, compact = false) {
  const num = Number(value) || 0;
  if (compact && Math.abs(num) >= 100000) {
    return `Rs ${(num / 100000).toFixed(1)}L`;
  }
  if (compact && Math.abs(num) >= 1000) {
    return `Rs ${(num / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num).replace('PKR', 'Rs');
}

/**
 * Format date for display
 * @param {string} dateStr
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
