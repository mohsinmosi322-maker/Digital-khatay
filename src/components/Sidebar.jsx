import { useState } from 'react';
import {
  Search,
  Plus,
  Users,
  LayoutDashboard,
  BookOpen,
  ArrowUpDown,
  Filter,
  Moon,
  Sun,
  Menu,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, getCustomerStats } from '../utils/storage';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const {
    filteredCustomers,
    selectedId,
    search,
    sortBy,
    sortDir,
    filter,
    theme,
    view,
    globalStats,
    dispatch,
    toggleTheme,
  } = useApp();

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    dispatch({ type: 'ADD_CUSTOMER', payload: { name: newName } });
    setNewName('');
    setShowAdd(false);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden no-print"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          sidebar fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-gray-200 bg-white
          transition-transform duration-200 dark:border-gray-800 dark:bg-gray-900
          lg:static lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          no-print
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white">Digital Khata</h1>
              <p className="text-xs text-gray-500">Debit & Recovery</p>
            </div>
          </div>
          <button
            className="btn-ghost p-2 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav tabs */}
        <div className="flex gap-1 border-b border-gray-200 p-2 dark:border-gray-800">
          <button
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
              view === 'ledger'
                ? 'bg-primary/10 text-primary'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'ledger' })}
          >
            <Users className="h-4 w-4" />
            Customers
          </button>
          <button
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
              view === 'dashboard'
                ? 'bg-primary/10 text-primary'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
            onClick={() => {
              dispatch({ type: 'SET_VIEW', payload: 'dashboard' });
              setMobileOpen(false);
            }}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-2 gap-2 border-b border-gray-200 p-3 dark:border-gray-800">
          <div className="rounded-lg bg-primary/5 p-2 dark:bg-primary/10">
            <p className="text-[10px] font-medium uppercase tracking-wide text-primary">Pending</p>
            <p className="text-sm font-bold text-danger">{formatCurrency(globalStats.pending, true)}</p>
          </div>
          <div className="rounded-lg bg-success/5 p-2 dark:bg-success/10">
            <p className="text-[10px] font-medium uppercase tracking-wide text-success">Received</p>
            <p className="text-sm font-bold text-success">{formatCurrency(globalStats.totalReceived, true)}</p>
          </div>
        </div>

        {/* Search + controls */}
        <div className="space-y-2 border-b border-gray-200 p-3 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search customers..."
              className="input pl-9"
              value={search}
              onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <select
                className="input appearance-none py-1.5 pl-8 pr-2 text-xs"
                value={filter}
                onChange={(e) => dispatch({ type: 'SET_FILTER', payload: e.target.value })}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="settled">Settled</option>
              </select>
            </div>
            <div className="relative flex-1">
              <ArrowUpDown className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <select
                className="input appearance-none py-1.5 pl-8 pr-2 text-xs"
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [by, dir] = e.target.value.split('-');
                  dispatch({ type: 'SET_SORT', payload: { by, dir } });
                }}
              >
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
                <option value="pending-desc">Pending ↓</option>
                <option value="pending-asc">Pending ↑</option>
                <option value="total-desc">Total ↓</option>
                <option value="recent-desc">Recent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Customer list */}
        <div className="flex-1 overflow-y-auto">
          {filteredCustomers.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              {search ? 'No customers match your search.' : 'No customers yet. Add one or import Excel.'}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredCustomers.map((c) => {
                const stats = getCustomerStats(c);
                const isSelected = c.id === selectedId && view === 'ledger';
                return (
                  <li key={c.id}>
                    <button
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                        isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                      }`}
                      onClick={() => {
                        dispatch({ type: 'SELECT', payload: c.id });
                        setMobileOpen(false);
                      }}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                          stats.pending > 0
                            ? 'bg-danger/10 text-danger'
                            : 'bg-success/10 text-success'
                        }`}
                      >
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                          {c.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {stats.txCount} txn · {formatCurrency(stats.totalAmount, true)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-semibold ${
                            stats.pending > 0 ? 'text-danger' : 'text-success'
                          }`}
                        >
                          {stats.pending > 0
                            ? formatCurrency(stats.pending, true)
                            : 'Settled'}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer actions */}
        <div className="space-y-2 border-t border-gray-200 p-3 dark:border-gray-800">
          {showAdd ? (
            <form onSubmit={handleAdd} className="flex gap-2">
              <input
                autoFocus
                className="input flex-1 py-1.5 text-sm"
                placeholder="Customer name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <button type="submit" className="btn-primary py-1.5 px-3 text-sm">
                Add
              </button>
              <button
                type="button"
                className="btn-ghost py-1.5 px-2"
                onClick={() => setShowAdd(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <button className="btn-primary w-full" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4" />
              Add Customer
            </button>
          )}
          <button className="btn-ghost w-full text-xs" onClick={toggleTheme}>
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4" /> Light mode
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" /> Dark mode
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export function MobileHeader({ setMobileOpen }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 lg:hidden no-print">
      <button className="btn-ghost p-2" onClick={() => setMobileOpen(true)} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
          <BookOpen className="h-4 w-4" />
        </div>
        <span className="font-semibold text-gray-900 dark:text-white">Digital Khata</span>
      </div>
    </header>
  );
}
