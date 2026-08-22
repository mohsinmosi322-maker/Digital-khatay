import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar, { MobileHeader } from './components/Sidebar';
import Ledger from './components/Ledger';
import Dashboard from './components/Dashboard';

function AppShell() {
  const { view, loaded } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!loaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-gray-500">Loading Digital Khata…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 dark:bg-gray-950 lg:flex-row">
      <MobileHeader setMobileOpen={setMobileOpen} />
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main className="main-content flex min-h-0 flex-1 flex-col overflow-hidden">
        {view === 'dashboard' ? <Dashboard /> : <Ledger />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
