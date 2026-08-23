const STORAGE_KEY = 'digital-khata-data-v2'
const THEME_KEY = 'digital-khata-theme'
const BUSINESS_KEY = 'digital-khata-business'

export function loadCustomers() {
  try {
    const v2 = localStorage.getItem(STORAGE_KEY)
    if (v2) {
      const data = JSON.parse(v2)
      return Array.isArray(data) ? data : []
    }
    const v1 = localStorage.getItem('digital-khata-data')
    if (v1) {
      const data = JSON.parse(v1)
      if (Array.isArray(data)) {
        localStorage.setItem(STORAGE_KEY, v1)
        return data
      }
    }
    return []
  } catch {
    return []
  }
}

export function saveCustomers(customers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers))
  } catch (err) {
    console.error(err)
    throw new Error('Storage full. Please export a backup.')
  }
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY)
}

export function loadTheme() {
  return localStorage.getItem(THEME_KEY) || 'light'
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme)
}

export function loadBusiness() {
  try {
    const raw = localStorage.getItem(BUSINESS_KEY)
    if (!raw) return { name: 'My Business', phone: '', address: '', currency: 'PKR' }
    return JSON.parse(raw)
  } catch {
    return { name: 'My Business', phone: '', address: '', currency: 'PKR' }
  }
}

export function saveBusiness(profile) {
  localStorage.setItem(BUSINESS_KEY, JSON.stringify(profile))
}

export function generateId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9)
}

export function getCustomerStats(customer) {
  const totalAmount = (customer.transactions || []).reduce((s, t) => s + (Number(t.amount) || 0), 0)
  const totalReceived = (customer.transactions || []).reduce((s, t) => s + (Number(t.received) || 0), 0)
  const pending = totalAmount - totalReceived
  return {
    totalAmount,
    totalReceived,
    pending: Math.max(0, pending),
    overpaid: pending < 0 ? Math.abs(pending) : 0,
    txCount: (customer.transactions || []).length,
  }
}

export function formatCurrency(value) {
  const num = Number(value) || 0
  return 'Rs ' + new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

export function normalizePhoneForWhatsApp(phone) {
  if (!phone) return null
  let digits = String(phone).replace(/\D/g, '')
  if (digits.startsWith('0')) digits = '92' + digits.slice(1)
  if (digits.length === 10) digits = '92' + digits
  if (digits.length < 11) return null
  return digits
}
