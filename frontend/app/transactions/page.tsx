'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, CATEGORIES } from '@/lib/utils'
import {
  Plus, Search, Filter, Edit2, Trash2, X, ChevronDown, Download
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface Expense {
  _id: string
  title: string
  amount: number
  category: string
  date: string
  notes?: string
}

const emptyForm = { title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0], notes: '' }

export default function TransactionsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Expense | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState({ category: '', minAmount: '', maxAmount: '', startDate: '', endDate: '' })
  const [showFilter, setShowFilter] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const LIMIT = 15

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: LIMIT }
      if (search) params.search = search
      if (filter.category) params.category = filter.category
      if (filter.minAmount) params.minAmount = filter.minAmount
      if (filter.maxAmount) params.maxAmount = filter.maxAmount
      if (filter.startDate) params.startDate = filter.startDate
      if (filter.endDate) params.endDate = filter.endDate
      const { data } = await api.get('/expenses', { params })
      setExpenses(data.expenses || [])
      setTotal(data.total || 0)
    } catch { toast.error('Failed to fetch transactions') }
    finally { setLoading(false) }
  }, [page, search, filter])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const openAdd = () => { setForm(emptyForm); setEditItem(null); setShowForm(true) }
  const openEdit = (e: Expense) => {
    setForm({ title: e.title, amount: String(e.amount), category: e.category, date: e.date.split('T')[0], notes: e.notes || '' })
    setEditItem(e); setShowForm(true)
  }

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, amount: parseFloat(form.amount) }
      if (editItem) {
        await api.put(`/expenses/${editItem._id}`, payload)
        toast.success('Transaction updated')
      } else {
        await api.post('/expenses', payload)
        toast.success('Transaction added')
      }
      setShowForm(false)
      fetchExpenses()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return
    try {
      await api.delete(`/expenses/${id}`)
      toast.success('Deleted')
      fetchExpenses()
    } catch { toast.error('Delete failed') }
  }

  const handleExportPDF = async () => {
    try {
      const response = await api.get('/export/pdf', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a'); a.href = url
      a.download = `fintrack-export-${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
    } catch { toast.error('Export failed') }
  }

  const handleExportExcel = async () => {
    try {
      const response = await api.get('/export/excel', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a'); a.href = url
      a.download = `fintrack-export-${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
    } catch { toast.error('Export failed') }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-slate-400 text-sm mt-1">{total} total records</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className="btn-ghost text-sm">
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <div className="absolute right-0 top-full mt-1 bg-surface-card border border-surface-border rounded-xl overflow-hidden hidden group-hover:block z-10 min-w-32">
              <button onClick={handleExportPDF} className="w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-surface-hover hover:text-white text-left">PDF Report</button>
              <button onClick={handleExportExcel} className="w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-surface-hover hover:text-white text-left">Excel Sheet</button>
            </div>
          </div>
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input className="input pl-10 h-11" placeholder="Search transactions…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <button onClick={() => setShowFilter(!showFilter)}
          className={clsx('btn-ghost h-11', showFilter && 'border-brand-500 text-brand-400')}>
          <Filter className="w-4 h-4" />
          Filters
          {Object.values(filter).some(Boolean) && (
            <span className="w-2 h-2 rounded-full bg-brand-400 ml-1" />
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <div className="card p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 animate-slide-up">
          <div>
            <label className="label text-xs">Category</label>
            <select className="input py-2" value={filter.category} onChange={e => setFilter({ ...filter, category: e.target.value })}>
              <option value="">All</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Min Amount</label>
            <input className="input py-2" type="number" placeholder="0"
              value={filter.minAmount} onChange={e => setFilter({ ...filter, minAmount: e.target.value })} />
          </div>
          <div>
            <label className="label text-xs">Max Amount</label>
            <input className="input py-2" type="number" placeholder="∞"
              value={filter.maxAmount} onChange={e => setFilter({ ...filter, maxAmount: e.target.value })} />
          </div>
          <div>
            <label className="label text-xs">From Date</label>
            <input className="input py-2" type="date"
              value={filter.startDate} onChange={e => setFilter({ ...filter, startDate: e.target.value })} />
          </div>
          <div>
            <label className="label text-xs">To Date</label>
            <input className="input py-2" type="date"
              value={filter.endDate} onChange={e => setFilter({ ...filter, endDate: e.target.value })} />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction</th>
                <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-right p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="text-right p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center p-12 text-slate-500">
                  <div className="flex justify-center">
                    <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                  </div>
                </td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={5} className="text-center p-12 text-slate-500">
                  <div className="text-4xl mb-2">💸</div>
                  <p>No transactions found</p>
                </td></tr>
              ) : expenses.map(tx => (
                <tr key={tx._id} className="border-b border-surface-border/50 hover:bg-surface-hover/50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-white text-sm">{tx.title}</div>
                    {tx.notes && <div className="text-xs text-slate-500 mt-0.5 truncate max-w-48">{tx.notes}</div>}
                  </td>
                  <td className="p-4">
                    <span className="badge" style={{ background: `${CATEGORY_COLORS[tx.category] || '#64748b'}20`, color: CATEGORY_COLORS[tx.category] || '#94a3b8' }}>
                      {getCategoryEmoji(tx.category)} {tx.category}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 text-sm">{formatDate(tx.date)}</td>
                  <td className="p-4 text-right font-semibold text-red-400 font-mono">{formatCurrency(tx.amount)}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(tx)} className="p-2 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-all">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(tx._id)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border">
            <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-ghost text-sm px-3 py-1.5 disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="btn-ghost text-sm px-3 py-1.5 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editItem ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input className="input" placeholder="e.g. Dinner at Pizza Hut" required
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount (₹)</label>
                  <input className="input" type="number" placeholder="0.00" min="0" step="0.01" required
                    value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <label className="label">Date</label>
                  <input className="input" type="date" required
                    value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{getCategoryEmoji(c)} {c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <textarea className="input resize-none" rows={2} placeholder="Any additional notes…"
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
                  {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (editItem ? 'Update' : 'Add Transaction')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#22c55e', Travel: '#3b82f6', Bills: '#f59e0b',
  Shopping: '#8b5cf6', Health: '#ec4899', Entertainment: '#06b6d4', Other: '#64748b',
}
function getCategoryEmoji(category: string) {
  const map: Record<string, string> = { Food: '🍔', Travel: '✈️', Bills: '📄', Shopping: '🛍️', Health: '💊', Entertainment: '🎬', Other: '📦' }
  return map[category] || '💳'
}
