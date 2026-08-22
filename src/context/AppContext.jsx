import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import {
  loadCustomers,
  saveCustomers,
  loadTheme,
  saveTheme,
  generateId,
  getCustomerStats,
} from '../utils/storage';

const AppContext = createContext(null);

const initialState = {
  customers: [],
  selectedId: null,
  search: '',
  sortBy: 'name', // name | pending | total | recent
  sortDir: 'asc',
  filter: 'all', // all | pending | settled
  theme: 'light',
  view: 'ledger', // ledger | dashboard
  loaded: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        customers: action.payload.customers,
        theme: action.payload.theme,
        loaded: true,
      };
    case 'SET_CUSTOMERS':
      return { ...state, customers: action.payload };
    case 'SELECT':
      return { ...state, selectedId: action.payload, view: 'ledger' };
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'SET_SORT':
      return {
        ...state,
        sortBy: action.payload.by ?? state.sortBy,
        sortDir: action.payload.dir ?? state.sortDir,
      };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_VIEW':
      return { ...state, view: action.payload };
    case 'ADD_CUSTOMER': {
      const customer = {
        id: generateId(),
        name: action.payload.name.trim(),
        transactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        customers: [...state.customers, customer],
        selectedId: customer.id,
      };
    }
    case 'UPDATE_CUSTOMER': {
      return {
        ...state,
        customers: state.customers.map((c) =>
          c.id === action.payload.id
            ? { ...c, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : c
        ),
      };
    }
    case 'DELETE_CUSTOMER': {
      const next = state.customers.filter((c) => c.id !== action.payload);
      return {
        ...state,
        customers: next,
        selectedId: state.selectedId === action.payload ? (next[0]?.id ?? null) : state.selectedId,
      };
    }
    case 'ADD_TRANSACTION': {
      return {
        ...state,
        customers: state.customers.map((c) => {
          if (c.id !== action.payload.customerId) return c;
          return {
            ...c,
            transactions: [...c.transactions, { id: generateId(), ...action.payload.tx }],
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    }
    case 'UPDATE_TRANSACTION': {
      return {
        ...state,
        customers: state.customers.map((c) => {
          if (c.id !== action.payload.customerId) return c;
          return {
            ...c,
            transactions: c.transactions.map((t) =>
              t.id === action.payload.txId ? { ...t, ...action.payload.updates } : t
            ),
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    }
    case 'DELETE_TRANSACTION': {
      return {
        ...state,
        customers: state.customers.map((c) => {
          if (c.id !== action.payload.customerId) return c;
          return {
            ...c,
            transactions: c.transactions.filter((t) => t.id !== action.payload.txId),
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    }
    case 'IMPORT_CUSTOMERS': {
      // Merge by name (case-insensitive)
      const existing = new Map(state.customers.map((c) => [c.name.toLowerCase(), c]));
      const imported = action.payload;
      for (const inc of imported) {
        const key = inc.name.toLowerCase();
        if (existing.has(key)) {
          const cur = existing.get(key);
          existing.set(key, {
            ...cur,
            transactions: [...cur.transactions, ...inc.transactions],
            updatedAt: new Date().toISOString(),
          });
        } else {
          existing.set(key, inc);
        }
      }
      return {
        ...state,
        customers: Array.from(existing.values()),
      };
    }
    case 'CLEAR_ALL':
      return { ...state, customers: [], selectedId: null };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load on mount
  useEffect(() => {
    const customers = loadCustomers();
    const theme = loadTheme();
    dispatch({ type: 'INIT', payload: { customers, theme } });
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  // Persist customers
  useEffect(() => {
    if (state.loaded) {
      saveCustomers(state.customers);
    }
  }, [state.customers, state.loaded]);

  // Persist theme
  useEffect(() => {
    if (state.loaded) {
      saveTheme(state.theme);
      document.documentElement.classList.toggle('dark', state.theme === 'dark');
    }
  }, [state.theme, state.loaded]);

  const toggleTheme = useCallback(() => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' });
  }, [state.theme]);

  // Derived filtered / sorted list
  const filteredCustomers = (() => {
    let list = [...state.customers];

    if (state.search.trim()) {
      const q = state.search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }

    if (state.filter === 'pending') {
      list = list.filter((c) => getCustomerStats(c).pending > 0);
    } else if (state.filter === 'settled') {
      list = list.filter((c) => getCustomerStats(c).pending === 0);
    }

    list.sort((a, b) => {
      const sa = getCustomerStats(a);
      const sb = getCustomerStats(b);
      let cmp = 0;
      switch (state.sortBy) {
        case 'pending':
          cmp = sa.pending - sb.pending;
          break;
        case 'total':
          cmp = sa.totalAmount - sb.totalAmount;
          break;
        case 'recent':
          cmp = (a.updatedAt || '').localeCompare(b.updatedAt || '');
          break;
        default:
          cmp = a.name.localeCompare(b.name);
      }
      return state.sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  })();

  const selectedCustomer =
    state.customers.find((c) => c.id === state.selectedId) || null;

  const globalStats = state.customers.reduce(
    (acc, c) => {
      const s = getCustomerStats(c);
      acc.totalAmount += s.totalAmount;
      acc.totalReceived += s.totalReceived;
      acc.pending += s.pending;
      acc.count += 1;
      if (s.pending > 0) acc.pendingCount += 1;
      return acc;
    },
    { totalAmount: 0, totalReceived: 0, pending: 0, count: 0, pendingCount: 0 }
  );

  const value = {
    ...state,
    filteredCustomers,
    selectedCustomer,
    globalStats,
    dispatch,
    toggleTheme,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
