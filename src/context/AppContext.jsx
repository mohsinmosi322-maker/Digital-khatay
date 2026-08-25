import { createContext, useContext, useEffect, useReducer, useCallback, useRef } from 'react'
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore'
import { generateId, getCustomerStats, loadTheme, saveTheme } from '../utils/storage'
import { db } from '../firebase'
import { useAuth } from './AuthContext'

const AppContext = createContext(null)

const initialState = {
  customers: [],
  selectedId: null,
  search: '',
  sortBy: 'name',
  sortDir: 'asc',
  filter: 'all',
  theme: loadTheme() || 'light',
  view: 'dashboard',
  business: { name: 'Digital Khata', phone: '', address: '', currency: 'PKR' },
  branding: {
    appName: 'Digital Khata',
    publisherName: '',
    publisherRemarks: '',
  },
  toast: null,
  loaded: false,
}

function reducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        customers: action.payload.customers || [],
        theme: action.payload.theme || state.theme,
        business: action.payload.business || state.business,
        branding: action.payload.branding || state.branding,
        loaded: true,
        selectedId: action.payload.keepSelected ? state.selectedId : state.selectedId,
        view: state.view || 'dashboard',
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
    case 'ADD_CUSTOMER_LOCAL': {
      const customer = action.payload
      return {
        ...state,
        customers: [...state.customers, customer],
        selectedId: customer.id,
        view: 'ledger',
        toast: { type: 'success', message: 'Customer Added Successfully' },
      }
    }
    case 'UPDATE_CUSTOMER_LOCAL': {
      return {
        ...state,
        customers: state.customers.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
        ),
        toast: action.payload.silent
          ? state.toast
          : { type: 'success', message: action.payload.message || 'Customer Updated Successfully' },
      }
    }
    case 'DELETE_CUSTOMER_LOCAL': {
      const next = state.customers.filter((c) => c.id !== action.payload)
      return {
        ...state,
        customers: next,
        selectedId: state.selectedId === action.payload ? next[0]?.id ?? null : state.selectedId,
        toast: { type: 'danger', message: 'Customer Deleted' },
      }
    }
    case 'ADD_TRANSACTION_LOCAL': {
      const amount = Number(action.payload.tx.amount) || 0
      const received = Number(action.payload.tx.received) || 0
      let toast = { type: 'success', message: 'Transaction Successful' }
      if (received > 0 && amount === 0) toast = { type: 'success', message: 'Recovery Successful' }
      else if (amount > 0 && received === 0) toast = { type: 'danger', message: 'Debit Entry Saved' }
      return {
        ...state,
        customers: state.customers.map((c) => {
          if (c.id !== action.payload.customerId) return c
          return {
            ...c,
            transactions: [...(c.transactions || []), action.payload.tx],
            updatedAt: new Date().toISOString(),
          }
        }),
        toast,
      }
    }
    case 'UPDATE_TRANSACTION_LOCAL': {
      return {
        ...state,
        customers: state.customers.map((c) => {
          if (c.id !== action.payload.customerId) return c
          return {
            ...c,
            transactions: (c.transactions || []).map((t) =>
              t.id === action.payload.txId ? { ...t, ...action.payload.updates } : t
            ),
            updatedAt: new Date().toISOString(),
          }
        }),
        toast: { type: 'success', message: 'Entry Updated' },
      }
    }
    case 'DELETE_TRANSACTION_LOCAL': {
      return {
        ...state,
        customers: state.customers.map((c) => {
          if (c.id !== action.payload.customerId) return c
          return {
            ...c,
            transactions: (c.transactions || []).filter((t) => t.id !== action.payload.txId),
            updatedAt: new Date().toISOString(),
          }
        }),
        toast: { type: 'danger', message: 'Entry Deleted' },
      }
    }
    case 'IMPORT_CUSTOMERS_LOCAL': {
      return {
        ...state,
        customers: action.payload,
        toast: { type: 'success', message: 'Import Complete' },
      }
    }
    case 'RESTORE_ALL_LOCAL':
      return {
        ...state,
        customers: action.payload.customers || [],
        business: action.payload.business || state.business,
        toast: { type: 'success', message: 'Backup Restored Successfully' },
      }
    case 'CLEAR_ALL_LOCAL':
      return {
        ...state,
        customers: [],
        selectedId: null,
        toast: { type: 'danger', message: 'All Data Cleared' },
      }
    default:
      return state
  }
}

function toFirestoreCustomer(c, userId) {
  return {
    userId,
    name: c.name || '',
    phone: c.phone || '',
    cnic: c.cnic || '',
    address: c.address || '',
    notes: c.notes || '',
    transactions: Array.isArray(c.transactions) ? c.transactions : [],
    createdAt: c.createdAt || new Date().toISOString(),
    updatedAt: c.updatedAt || new Date().toISOString(),
  }
}

async function resolveBrandingAndBusiness(profile) {
  let branding = {
    appName: 'Digital Khata',
    publisherName: '',
    publisherRemarks: '',
  }
  let business = {
    name: 'Digital Khata',
    phone: '',
    address: '',
    currency: 'PKR',
  }

  try {
    const sSnap = await getDoc(doc(db, 'settings', 'app'))
    if (sSnap.exists()) {
      const s = sSnap.data()
      const appName = s.appName || s.businessName || 'Digital Khata'
      branding = {
        appName,
        publisherName: s.publisherName || '',
        publisherRemarks: s.publisherRemarks || '',
      }
      business = {
        name: appName,
        phone: s.businessPhone || s.contactWhatsApp || '',
        address: s.businessAddress || '',
        currency: s.businessCurrency || 'PKR',
      }
    }
  } catch (_) {}

  if (profile?.businessName && branding.appName === 'Digital Khata') {
    business = { ...business, name: profile.businessName }
  }

  return { branding, business }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { profile } = useAuth()
  const uid = profile?.id
  const customersRef = useRef(state.customers)
  customersRef.current = state.customers
  const loadingRef = useRef(false)

  // Theme immediately (no wait for cloud)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark')
  }, [state.theme])

  const loadCloud = useCallback(
    async (opts = {}) => {
      if (!uid || loadingRef.current) return
      loadingRef.current = true
      try {
        const [brandBiz, snap] = await Promise.all([
          resolveBrandingAndBusiness(profile),
          getDocs(query(collection(db, 'customers'), where('userId', '==', uid))),
        ])
        const customers = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          transactions: d.data().transactions || [],
        }))
        dispatch({
          type: 'INIT',
          payload: {
            customers,
            theme: loadTheme(),
            business: brandBiz.business,
            branding: brandBiz.branding,
            keepSelected: true,
          },
        })
        if (opts.toast) {
          dispatch({ type: 'TOAST', payload: { type: 'success', message: 'Data refreshed' } })
        }
      } catch (e) {
        console.error(e)
        const brandBiz = await resolveBrandingAndBusiness(profile).catch(() => ({
          branding: state.branding,
          business: state.business,
        }))
        dispatch({
          type: 'INIT',
          payload: {
            customers: customersRef.current,
            theme: loadTheme(),
            business: brandBiz.business,
            branding: brandBiz.branding,
            keepSelected: true,
          },
        })
        if (opts.toast !== false) {
          dispatch({
            type: 'TOAST',
            payload: { type: 'danger', message: 'Could not load cloud data. Check connection.' },
          })
        }
      } finally {
        loadingRef.current = false
      }
    },
    [uid, profile]
  )

  // Load once when user ready — no auto-reload on every tab focus (was slow)
  useEffect(() => {
    if (!uid) return
    loadCloud({ toast: false })
  }, [uid])

  useEffect(() => {
    if (state.loaded) saveTheme(state.theme)
  }, [state.theme, state.loaded])

  useEffect(() => {
    if (!state.toast) return
    const t = setTimeout(() => dispatch({ type: 'TOAST', payload: null }), 2200)
    return () => clearTimeout(t)
  }, [state.toast])

  const persistCustomer = useCallback(
    async (customer) => {
      if (!uid || !customer?.id) return
      await setDoc(doc(db, 'customers', customer.id), toFirestoreCustomer(customer, uid), {
        merge: true,
      })
    },
    [uid]
  )

  const removeCustomerDoc = useCallback(
    async (id) => {
      if (!uid || !id) return
      await deleteDoc(doc(db, 'customers', id))
    },
    [uid]
  )

  const reload = useCallback(() => {
    loadCloud({ toast: true })
  }, [loadCloud])

  const appDispatch = useCallback(
    async (action) => {
      if (!action || !action.type) return

      if (
        ['SELECT', 'SET_SEARCH', 'SET_SORT', 'SET_FILTER', 'SET_THEME', 'SET_VIEW', 'SET_BUSINESS', 'TOAST'].includes(
          action.type
        )
      ) {
        dispatch(action)
        return
      }

      if (!uid) {
        dispatch({ type: 'TOAST', payload: { type: 'danger', message: 'Not logged in' } })
        return
      }

      const list = customersRef.current

      try {
        if (action.type === 'ADD_CUSTOMER') {
          const id = generateId()
          const customer = {
            id,
            name: action.payload.name.trim(),
            phone: (action.payload.phone || '').trim(),
            cnic: (action.payload.cnic || '').trim(),
            address: (action.payload.address || '').trim(),
            notes: '',
            transactions: [],
            userId: uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          dispatch({ type: 'ADD_CUSTOMER_LOCAL', payload: customer })
          await persistCustomer(customer)
          return
        }

        if (action.type === 'UPDATE_CUSTOMER') {
          const cur = list.find((c) => c.id === action.payload.id)
          if (!cur) return
          const updated = {
            ...cur,
            ...action.payload.updates,
            updatedAt: new Date().toISOString(),
          }
          dispatch({
            type: 'UPDATE_CUSTOMER_LOCAL',
            payload: { id: action.payload.id, updates: updated },
          })
          await persistCustomer(updated)
          return
        }

        if (action.type === 'DELETE_CUSTOMER') {
          dispatch({ type: 'DELETE_CUSTOMER_LOCAL', payload: action.payload })
          await removeCustomerDoc(action.payload)
          return
        }

        if (action.type === 'ADD_TRANSACTION') {
          const cur = list.find((c) => c.id === action.payload.customerId)
          if (!cur) return
          const tx = { id: generateId(), ...action.payload.tx }
          const updated = {
            ...cur,
            transactions: [...(cur.transactions || []), tx],
            updatedAt: new Date().toISOString(),
          }
          dispatch({
            type: 'ADD_TRANSACTION_LOCAL',
            payload: { customerId: action.payload.customerId, tx },
          })
          await persistCustomer(updated)
          return
        }

        if (action.type === 'UPDATE_TRANSACTION') {
          const cur = list.find((c) => c.id === action.payload.customerId)
          if (!cur) return
          const updated = {
            ...cur,
            transactions: (cur.transactions || []).map((t) =>
              t.id === action.payload.txId ? { ...t, ...action.payload.updates } : t
            ),
            updatedAt: new Date().toISOString(),
          }
          dispatch({
            type: 'UPDATE_TRANSACTION_LOCAL',
            payload: action.payload,
          })
          await persistCustomer(updated)
          return
        }

        if (action.type === 'DELETE_TRANSACTION') {
          const cur = list.find((c) => c.id === action.payload.customerId)
          if (!cur) return
          const updated = {
            ...cur,
            transactions: (cur.transactions || []).filter((t) => t.id !== action.payload.txId),
            updatedAt: new Date().toISOString(),
          }
          dispatch({
            type: 'DELETE_TRANSACTION_LOCAL',
            payload: action.payload,
          })
          await persistCustomer(updated)
          return
        }

        if (action.type === 'IMPORT_CUSTOMERS') {
          const incoming = action.payload || []
          const merged = [...list]
          for (const inc of incoming) {
            const id = inc.id || generateId()
            const customer = {
              ...inc,
              id,
              userId: uid,
              transactions: inc.transactions || [],
              updatedAt: new Date().toISOString(),
              createdAt: inc.createdAt || new Date().toISOString(),
            }
            await persistCustomer(customer)
            const idx = merged.findIndex((c) => c.name.toLowerCase() === customer.name.toLowerCase())
            if (idx >= 0) merged[idx] = { ...merged[idx], ...customer, id: merged[idx].id }
            else merged.push(customer)
          }
          dispatch({ type: 'IMPORT_CUSTOMERS_LOCAL', payload: merged })
          return
        }

        if (action.type === 'RESTORE_ALL') {
          const incoming = action.payload.customers || []
          for (const c of list) {
            await removeCustomerDoc(c.id)
          }
          const next = []
          for (const inc of incoming) {
            const id = generateId()
            const customer = {
              ...inc,
              id,
              userId: uid,
              transactions: inc.transactions || [],
              createdAt: inc.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
            await persistCustomer(customer)
            next.push(customer)
          }
          dispatch({
            type: 'RESTORE_ALL_LOCAL',
            payload: { customers: next, business: action.payload.business },
          })
          return
        }

        if (action.type === 'CLEAR_ALL') {
          for (const c of list) {
            await removeCustomerDoc(c.id)
          }
          dispatch({ type: 'CLEAR_ALL_LOCAL' })
          return
        }

        dispatch(action)
      } catch (e) {
        console.error(e)
        dispatch({
          type: 'TOAST',
          payload: {
            type: 'danger',
            message: e?.code === 'permission-denied' ? 'Permission denied' : 'Save failed. Check internet.',
          },
        })
      }
    },
    [uid, persistCustomer, removeCustomerDoc]
  )

  const toggleTheme = useCallback(() => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' })
  }, [state.theme])

  const filteredCustomers = (() => {
    let list = [...state.customers]
    if (state.search.trim()) {
      const q = state.search.toLowerCase()
      list = list.filter(
        (c) =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.phone || '').includes(q) ||
          (c.cnic || '').includes(q) ||
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
      else cmp = (a.name || '').localeCompare(b.name || '')
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
        dispatch: appDispatch,
        toggleTheme,
        reload,
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
