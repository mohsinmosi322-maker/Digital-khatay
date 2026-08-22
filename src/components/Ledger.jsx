import { useState } from 'react';
import {
  Plus,
  Trash2,
  Pencil,
  Download,
  Printer,
  X,
  Check,
  Calendar,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, getCustomerStats } from '../utils/storage';
import { exportToCSV, downloadFile } from '../utils/excel';

const emptyTx = {
  date: new Date().toISOString().slice(0, 10),
  billNo: '',
  amount: '',
  received: '',
  receivedDate: '',
};

export default function Ledger() {
  const { selectedCustomer, customers, dispatch } = useApp();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyTx);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyTx);
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (!selectedCustomer) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <FileText className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          Select a customer
        </h2>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          Choose a customer from the list to view their date-wise ledger, or add a new customer.
        </p>
      </div>
    );
  }

  const stats = getCustomerStats(selectedCustomer);
  const txs = [...selectedCustomer.transactions].sort((a, b) =>
    (a.date || '').localeCompare(b.date || '')
  );

  const handleAdd = (e) => {
    e.preventDefault();
    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        customerId: selectedCustomer.id,
        tx: {
          date: addForm.date,
          billNo: addForm.billNo.trim(),
          amount: Number(addForm.amount) || 0,
          received: Number(addForm.received) || 0,
          receivedDate: addForm.receivedDate || null,
        },
      },
    });
    setAddForm(emptyTx);
    setShowAdd(false);
  };

  const startEdit = (tx) => {
    setEditingId(tx.id);
    setEditForm({
      date: tx.date || '',
      billNo: tx.billNo || '',
      amount: tx.amount ?? '',
      received: tx.received ?? '',
      receivedDate: tx.receivedDate || '',
    });
  };

  const saveEdit = () => {
    dispatch({
      type: 'UPDATE_TRANSACTION',
      payload: {
        customerId: selectedCustomer.id,
        txId: editingId,
        updates: {
          date: editForm.date,
          billNo: editForm.billNo.trim(),
          amount: Number(editForm.amount) || 0,
          received: Number(editForm.received) || 0,
          receivedDate: editForm.receivedDate || null,
        },
      },
    });
    setEditingId(null);
  };

  const handleExport = () => {
    const csv = exportToCSV(customers, selectedCustomer.id);
    const safeName = selectedCustomer.name.replace(/[^\w\-]+/g, '_');
    downloadFile(csv, `${safeName}_ledger.csv`);
  };

  const handlePrint = () => window.print();

  const handleDeleteCustomer = () => {
    if (confirmDelete === selectedCustomer.id) {
      dispatch({ type: 'DELETE_CUSTOMER', payload: selectedCustomer.id });
      setConfirmDelete(null);
    } else {
      setConfirmDelete(selectedCustomer.id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {selectedCustomer.name}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {stats.txCount} transaction{stats.txCount !== 1 ? 's' : ''} · Last updated{' '}
              {formatDate(selectedCustomer.updatedAt?.slice(0, 10))}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 no-print">
            <button className="btn-secondary text-sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button className="btn-secondary text-sm" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              className={`btn text-sm ${
                confirmDelete === selectedCustomer.id
                  ? 'bg-danger text-white'
                  : 'btn-ghost text-danger'
              }`}
              onClick={handleDeleteCustomer}
            >
              <Trash2 className="h-4 w-4" />
              {confirmDelete === selectedCustomer.id ? 'Confirm?' : 'Delete'}
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
            <p className="text-xs font-medium text-gray-500">Total Debit</p>
            <p className="mt-0.5 text-lg font-bold text-primary">
              {formatCurrency(stats.totalAmount)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
            <p className="text-xs font-medium text-gray-500">Received</p>
            <p className="mt-0.5 text-lg font-bold text-success">
              {formatCurrency(stats.totalReceived)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
            <p className="text-xs font-medium text-gray-500">Pending</p>
            <p
              className={`mt-0.5 text-lg font-bold ${
                stats.pending > 0 ? 'text-danger' : 'text-success'
              }`}
            >
              {formatCurrency(stats.pending)}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-gray-800 sm:px-6 no-print">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Date-wise Ledger
        </h3>
        <button className="btn-primary text-sm py-1.5" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Add Entry
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="border-b border-gray-200 bg-primary/5 px-4 py-3 dark:border-gray-800 dark:bg-primary/10 sm:px-6 no-print"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Date
              </label>
              <input
                type="date"
                required
                className="input py-1.5 text-sm"
                value={addForm.date}
                onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Bill No
              </label>
              <input
                className="input py-1.5 text-sm"
                placeholder="Optional"
                value={addForm.billNo}
                onChange={(e) => setAddForm({ ...addForm, billNo: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Amount (Debit)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                className="input py-1.5 text-sm"
                placeholder="0"
                value={addForm.amount}
                onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Received
              </label>
              <input
                type="number"
                min="0"
                step="1"
                className="input py-1.5 text-sm"
                placeholder="0"
                value={addForm.received}
                onChange={(e) => setAddForm({ ...addForm, received: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Received Date
              </label>
              <input
                type="date"
                className="input py-1.5 text-sm"
                value={addForm.receivedDate}
                onChange={(e) => setAddForm({ ...addForm, receivedDate: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="submit" className="btn-primary text-sm py-1.5">
              <Check className="h-4 w-4" /> Save Entry
            </button>
            <button
              type="button"
              className="btn-ghost text-sm py-1.5"
              onClick={() => {
                setShowAdd(false);
                setAddForm(emptyTx);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {txs.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-sm text-gray-500">
            <Calendar className="mb-2 h-8 w-8 text-gray-300" />
            No transactions yet. Click “Add Entry” to start.
          </div>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900">
              <tr className="border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800">
                <th className="px-4 py-3 sm:px-6">Date</th>
                <th className="px-3 py-3">Bill No</th>
                <th className="px-3 py-3 text-right">Amount</th>
                <th className="px-3 py-3 text-right">Received</th>
                <th className="px-3 py-3">Rec. Date</th>
                <th className="px-3 py-3 text-right">Balance</th>
                <th className="px-4 py-3 text-right no-print sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {txs.map((tx) => {
                const bal = (Number(tx.amount) || 0) - (Number(tx.received) || 0);
                const isEditing = editingId === tx.id;

                if (isEditing) {
                  return (
                    <tr key={tx.id} className="bg-primary/5 dark:bg-primary/10">
                      <td className="px-4 py-2 sm:px-6">
                        <input
                          type="date"
                          className="input py-1 text-sm"
                          value={editForm.date}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="input py-1 text-sm"
                          value={editForm.billNo}
                          onChange={(e) => setEditForm({ ...editForm, billNo: e.target.value })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className="input py-1 text-sm text-right"
                          value={editForm.amount}
                          onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className="input py-1 text-sm text-right"
                          value={editForm.received}
                          onChange={(e) => setEditForm({ ...editForm, received: e.target.value })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          className="input py-1 text-sm"
                          value={editForm.receivedDate}
                          onChange={(e) =>
                            setEditForm({ ...editForm, receivedDate: e.target.value })
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-gray-400">—</td>
                      <td className="px-4 py-2 text-right sm:px-6 no-print">
                        <div className="flex justify-end gap-1">
                          <button className="btn-primary p-1.5" onClick={saveEdit} title="Save">
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            className="btn-ghost p-1.5"
                            onClick={() => setEditingId(null)}
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 sm:px-6">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">
                      {tx.billNo || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-primary">
                      {tx.amount ? formatCurrency(tx.amount) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-success">
                      {tx.received ? formatCurrency(tx.received) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-gray-600 dark:text-gray-400">
                      {formatDate(tx.receivedDate)}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-right font-semibold ${
                        bal > 0 ? 'text-danger' : bal < 0 ? 'text-success' : 'text-gray-500'
                      }`}
                    >
                      {formatCurrency(bal)}
                    </td>
                    <td className="px-4 py-2.5 text-right sm:px-6 no-print">
                      <div className="flex justify-end gap-1">
                        <button
                          className="btn-ghost p-1.5 text-gray-500 hover:text-primary"
                          onClick={() => startEdit(tx)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="btn-ghost p-1.5 text-gray-500 hover:text-danger"
                          onClick={() =>
                            dispatch({
                              type: 'DELETE_TRANSACTION',
                              payload: {
                                customerId: selectedCustomer.id,
                                txId: tx.id,
                              },
                            })
                          }
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold dark:border-gray-600 dark:bg-gray-900">
                <td className="px-4 py-3 sm:px-6" colSpan={2}>
                  Totals
                </td>
                <td className="px-3 py-3 text-right text-primary">
                  {formatCurrency(stats.totalAmount)}
                </td>
                <td className="px-3 py-3 text-right text-success">
                  {formatCurrency(stats.totalReceived)}
                </td>
                <td className="px-3 py-3" />
                <td
                  className={`px-3 py-3 text-right ${
                    stats.pending > 0 ? 'text-danger' : 'text-success'
                  }`}
                >
                  {formatCurrency(stats.pending)}
                </td>
                <td className="no-print" />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
