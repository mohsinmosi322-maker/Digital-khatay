import { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import {
  loadCustomers,
  saveCustomers,
  loadTheme,
  saveTheme,
  loadBusiness,
  saveBusiness,
  generateId,
  getCustomerStats,
} from '../utils/storage'

const AppContext = createContext(null)

const initialState = {
  customers: [],
  selectedId: null,
  search: '',
  sortBy: 'name',
  sortDir: 'asc',
  filter: 'all',
  theme: 'light',
  view: 'ledger',
  business: { name: 'My Business', phone: '', address: '', currency: 'PKR' },
  toast: null,
  loaded: false,
}

function reducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        customers: action.payload.customers,
        theme: action.payload.theme,
        business: action.payload.business,
        loaded: true,
      }
    case 'SELECT':
      return { ...state, selectedId: action.payload, view: 'ledger' }
    case 'SET_SEARCH':
      return { ...state, search: action.payload }
    case 'SET_SORT':
      return {
        ...state,
        sortBy: action.payload.by ?? state.sortBy,
        sortDir: action.payload.dir ?? state.sortDir,
      }
    case 'SET_FILTER':
      return { ...state, filter: action.payload }
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    case 'SET_VIEW':
      return { ...state, view: action.payload }
    case 'SET_BUSINESS':
      return { ...state, business: { ...state.business, ...action.payload } }
    case 'TOAST':
      return { ...state, toast: action.payload }
    case 'ADD_CUSTOMER': {
      const customer = {
        id: generateId(),
        name: action.payload.name.trim(),
        phone: (action.payload.phone || '').trim(),
        address: (action.payload.address || '').trim(),
        notes: '',
        transactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      return {
        ...state,
        customers: [...state.customers, customer],
        selectedId: customer.id,
        toast: { type: 'success', message: 'Customer added' },
      }
    }
    case 'UPDATE_CUSTOMER': {
      return {
        ...state,
        customers: state.customers.map((c) =>
          c.id === action.payload.id
            ? { ...c, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : c
        ),
        toast: { type: 'success', message: 'Customer updated' },
      }
    }
    case 'DELETE_CUSTOMER': {
      const next = state.customers.filter((c) => c.id !== action.payload)
      return {
        ...state,
        customers: next,
        selectedId: state.selectedId === action.payload ? next[0]?.id ?? null : state.selectedId,
        toast: { type: 'success', message: 'Customer deleted' },
      }
    }
    case 'ADD_TRANSACTION': {
      return {
        ...state,
        customers: state.customers.map((c) => {
          if (c.id !== action.payload.customerId) return c
          return {
            ...c,
            transactions: [...c.transactions, { id: generateId(), ...action.payload.tx }],
            updatedAt: new Date().toISOString(),
          }
        }),
        toast: { type: 'success', message: 'Entry saved' },
      }
    }
    case 'UPDATE_TRANSACTION': {
      return {
        ...state,
        customers: state.customers.map((c) => {
          if (c.id !== action.payload.customerId) return c
          return {
            ...c,
            transactions: c.transactions.map((t) =>
              t.id === action.payload.txId ? { ...t, ...action.payload.updates } : t
            ),
            updatedAt: new Date().toISOString(),
          }
        }),
      }
    }
    case 'DELETE_TRANSACTION': {
      return {
        ...state,
        customers: state.customers.map((c) => {
          if (c.id !== action.payload.customerId) return c
          return {
            ...c,
            transactions: c.transactions.filter((t) => t.id !== action.payload.txId),
            updatedAt: new Date().toISOString(),
          }
        }),
        toast: { type: 'success', message: 'Entry deleted' },
      }
    }
    case 'IMPORT_CUSTOMERS': {
      const existing = new Map(state.customers.map((c) => [c.name.toLowerCase(), c]))
      for (const inc of action.payload) {
        const key = inc.name.toLowerCase()
        if (existing.has(key)) {
          const cur = existing.get(key)
          existing.set(key, {
            ...cur,
            phone: cur.phone || inc.phone || '',
            address: cur.address || inc.address || '',
            transactions: [...cur.transactions, ...inc.transactions],
            updatedAt: new Date().toISOString(),
          })
        } else {
          existing.set(key, inc)
        }
      }
      return {
        ...state,
        customers: Array.from(existing.values()),
        toast: { type: 'success', message: 'Import complete' },
      }
    }
    case 'RESTORE_ALL':
      return {
        ...state,
        customers: action.payload.customers || [],
        business: action.payload.business || state.business,
        toast: { type: 'success', message: 'Backup restored' },
      }
    case 'CLEAR_ALL':
      return {
        ...state,
        customers: [],
        selectedId: null,
        toast: { type: 'success', message: 'All data cleared' },
      }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    dispatch({
      type: 'INIT',
      payload: {
        customers: loadCustomers(),
        theme: loadTheme(),
        business: loadBusiness(),
      },
    })
  }, [])

  useEffect(() => {
    if (state.loaded) saveCustomers(state.customers)
  }, [state.customers, state.loaded])

  useEffect(() => {
    if (state.loaded) {
      saveTheme(state.theme)
      document.documentElement.classList.toggle('dark', state.theme === 'dark')
    }
  }, [state.theme, state.loaded])

  useEffect(() => {
    if (state.loaded) saveBusiness(state.business)
  }, [state.business, state.loaded])

  useEffect(() => {
    if (!state.toast) return
    const t = setTimeout(() => dispatch({ type: 'TOAST', payload: null }), 2500)
    return () => clearTimeout(t)
  }, [state.toast])

  const toggleTheme = useCallback(() => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' })
  }, [state.theme])

  const filteredCustomers = (() => {
    let list = [...state.customers]
    if (state.search.trim()) {
      const q = state.search.toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone || '').includes(q) ||
          (c.address || '').toLowerCase().includes(q)
      )
    }
    if (state.filter === 'pending') list = list.filter((c) => getCustomerStats(c).pending > 0)
    if (state.filter === 'settled') list = list.filter((c) => getCustomerStats(c).pending === 0)

    list.sort((a, b) => {
      const sa = getCustomerStats(a)
      const sb = getCustomerStats(b)
      let cmp = 0
      if (state.sortBy === 'pending') cmp = sa.pending - sb.pending
      else if (state.sortBy === 'total') cmp = sa.totalAmount - sb.totalAmount
      else if (state.sortBy === 'recent') cmp = (a.updatedAt || '').localeCompare(b.updatedAt || '')
      else cmp = a.name.localeCompare(b.name)
      return state.sortDir === 'asc' ? cmp : -cmp
    })
    return list
  })()

  const selectedCustomer = state.customers.find((c) => c.id === state.selectedId) || null

  const globalStats = state.customers.reduce(
    (acc, c) => {
      const s = getCustomerStats(c)
      acc.totalAmount += s.totalAmount
      acc.totalReceived += s.totalReceived
      acc.pending += s.pending
      acc.count += 1
      if (s.pending > 0) acc.pendingCount += 1
      return acc
    },
    { totalAmount: 0, totalReceived: 0, pending: 0, count: 0, pendingCount: 0 }
  )

  return (
    <AppContext.Provider
      value={{
        ...state,
        filteredCustomers,
        selectedCustomer,
        globalStats,
        dispatch,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
