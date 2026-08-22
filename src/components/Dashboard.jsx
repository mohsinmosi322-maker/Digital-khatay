import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Download,
  Upload,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, getCustomerStats, clearAllData } from '../utils/storage';
import { exportToCSV, downloadFile, exportJSON } from '../utils/excel';
import { useRef, useState } from 'react';
import { parseExcelFile } from '../utils/excel';

const COLORS = ['#E24B4A', '#3B6D11', '#185FA5', '#8B5CF6', '#F59E0B'];

export default function Dashboard() {
  const { customers, globalStats, dispatch } = useApp();
  const fileRef = useRef(null);
  const [importMsg, setImportMsg] = useState(null);
  const [importing, setImporting] = useState(false);

  // Top pending customers
  const topPending = [...customers]
    .map((c) => ({ name: c.name, ...getCustomerStats(c) }))
    .filter((c) => c.pending > 0)
    .sort((a, b) => b.pending - a.pending)
    .slice(0, 8);

  // Pie: pending vs received
  const pieData = [
    { name: 'Pending', value: globalStats.pending },
    { name: 'Received', value: globalStats.totalReceived },
  ].filter((d) => d.value > 0);

  // Monthly trend (aggregate by month from all txs)
  const monthMap = {};
  for (const c of customers) {
    for (const tx of c.transactions) {
      if (!tx.date) continue;
      const key = tx.date.slice(0, 7); // YYYY-MM
      if (!monthMap[key]) monthMap[key] = { month: key, amount: 0, received: 0 };
      monthMap[key].amount += Number(tx.amount) || 0;
      monthMap[key].received += Number(tx.received) || 0;
    }
  }
  const monthlyData = Object.values(monthMap)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12)
    .map((d) => ({
      ...d,
      label: d.month.slice(5) + '/' + d.month.slice(2, 4),
    }));

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const { customers: imported, errors } = await parseExcelFile(file);
      if (imported.length) {
        dispatch({ type: 'IMPORT_CUSTOMERS', payload: imported });
        setImportMsg({
          type: 'success',
          text: `Imported ${imported.length} customer(s)${
            errors.length ? ` (${errors.length} warnings)` : ''
          }.`,
        });
      } else {
        setImportMsg({
          type: 'error',
          text: errors[0] || 'No valid data found in file.',
        });
      }
    } catch (err) {
      setImportMsg({ type: 'error', text: err.message || 'Failed to parse file.' });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleExportAll = () => {
    const csv = exportToCSV(customers);
    downloadFile(csv, `digital-khata_export_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleBackupJSON = () => {
    const json = exportJSON(customers);
    downloadFile(json, `digital-khata_backup_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  };

  const handleClear = () => {
    if (window.confirm('Delete ALL data? This cannot be undone. Export a backup first.')) {
      clearAllData();
      dispatch({ type: 'CLEAR_ALL' });
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
        <p className="text-sm text-gray-500">Overview of your debit & recovery ledger</p>
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={<Users className="h-5 w-5" />}
          label="Customers"
          value={globalStats.count}
          sub={`${globalStats.pendingCount} with pending`}
          color="primary"
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Total Debit"
          value={formatCurrency(globalStats.totalAmount, true)}
          color="primary"
        />
        <KpiCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Total Received"
          value={formatCurrency(globalStats.totalReceived, true)}
          color="success"
        />
        <KpiCard
          icon={<AlertCircle className="h-5 w-5" />}
          label="Outstanding"
          value={formatCurrency(globalStats.pending, true)}
          color="danger"
        />
      </div>

      {/* Charts */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Monthly Debit vs Received
          </h3>
          {monthlyData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v) => formatCurrency(v)}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="amount" name="Debit" fill="#185FA5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="received" name="Received" fill="#3B6D11" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-4">
          <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Recovery Split
          </h3>
          {pieData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top pending */}
      <div className="mb-6 card p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Top Outstanding Customers
        </h3>
        {topPending.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">All accounts settled 🎉</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500 dark:border-gray-700">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Customer</th>
                  <th className="pb-2 pr-4 text-right">Debit</th>
                  <th className="pb-2 pr-4 text-right">Received</th>
                  <th className="pb-2 text-right">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {topPending.map((c, i) => (
                  <tr key={c.name}>
                    <td className="py-2.5 pr-4 text-gray-400">{i + 1}</td>
                    <td className="py-2.5 pr-4 font-medium">{c.name}</td>
                    <td className="py-2.5 pr-4 text-right text-primary">
                      {formatCurrency(c.totalAmount)}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-success">
                      {formatCurrency(c.totalReceived)}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-danger">
                      {formatCurrency(c.pending)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Data tools */}
      <div className="card p-4 no-print">
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Data Import / Export
        </h3>
        <p className="mb-4 text-xs text-gray-500">
          Upload an Excel (.xlsx / .xls) or CSV file with columns: Customer Name, Date, Bill No,
          Amount, Received, Received Date. Data is stored only in your browser (LocalStorage).
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleImport}
          />
          <button
            className="btn-primary text-sm"
            disabled={importing}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {importing ? 'Importing…' : 'Import Excel / CSV'}
          </button>
          <button className="btn-secondary text-sm" onClick={handleExportAll}>
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button className="btn-secondary text-sm" onClick={handleBackupJSON}>
            <Download className="h-4 w-4" />
            Backup JSON
          </button>
          <button className="btn-ghost text-sm text-danger" onClick={handleClear}>
            <Trash2 className="h-4 w-4" />
            Clear All Data
          </button>
        </div>
        {importMsg && (
          <p
            className={`mt-3 text-sm ${
              importMsg.type === 'success' ? 'text-success' : 'text-danger'
            }`}
          >
            {importMsg.text}
          </p>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color }) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    danger: 'bg-danger/10 text-danger',
  };
  return (
    <div className="card flex items-start gap-3 p-4">
      <div className={`rounded-lg p-2 ${colorMap[color]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="truncate text-lg font-bold text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[240px] items-center justify-center text-sm text-gray-400">
      No data yet — add transactions or import Excel
    </div>
  );
}
