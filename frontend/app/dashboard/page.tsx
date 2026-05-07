'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, DollarSign, Target,
  Sparkles, ArrowUpRight, ArrowDownRight, Plus, Brain
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Link from 'next/link'
import toast from 'react-hot-toast'

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#22c55e', Travel: '#3b82f6', Bills: '#f59e0b',
  Shopping: '#8b5cf6', Health: '#ec4899', Entertainment: '#06b6d4',
  Other: '#64748b',
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null)
  const [recentTx, setRecentTx] = useState<any[]>([])
  const [aiInsights, setAiInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, txRes] = await Promise.all([
          api.get('/summary'),
          api.get('/expenses?limit=5'),
        ])
        setSummary(sumRes.data)
        setRecentTx(txRes.data.expenses || [])
      } catch {
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const fetchAiInsights = async () => {
    setAiLoading(true)
    try {
      const { data } = await api.get('/ai/insights')
      setAiInsights(data)
    } catch {
      toast.error('AI insights unavailable')
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    )
  }

  const stats = [
    {
      label: 'Total This Month',
      value: formatCurrency(summary?.monthTotal || 0),
      icon: DollarSign,
      change: summary?.monthChange || 0,
      color: 'text-brand-400',
      bg: 'bg-brand-500/10',
    },
    {
      label: 'This Week',
      value: formatCurrency(summary?.weekTotal || 0),
      icon: TrendingUp,
      change: summary?.weekChange || 0,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Daily Average',
      value: formatCurrency(summary?.dailyAvg || 0),
      icon: ArrowUpRight,
      change: null,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Budget Used',
      value: `${summary?.budgetUsed || 0}%`,
      icon: Target,
      change: null,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ]

  const categoryData = Object.entries(summary?.byCategory || {}).map(([name, value]) => ({
    name, value: value as number
  }))

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Your financial overview for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>
        <Link href="/transactions" className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Expense
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="card p-5 hover:border-brand-500/30 transition-colors" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm">{s.label}</span>
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
              </div>
            </div>
            <div className={`stat-value ${s.color}`}>{s.value}</div>
            {s.change !== null && (
              <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${s.change >= 0 ? 'text-red-400' : 'text-brand-400'}`}>
                {s.change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {Math.abs(s.change)}% vs last month
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly trend chart */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="text-white font-semibold mb-4">Monthly Spending Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={summary?.monthlyTrend || []}>
              <XAxis dataKey="month" stroke="#475569" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis stroke="#475569" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip
                contentStyle={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '12px', color: '#e2e8f0' }}
                formatter={(v: any) => [formatCurrency(v), 'Spent']}
              />
              <Line type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2.5}
                dot={{ fill: '#22c55e', strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: '#22c55e' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie chart */}
        <div className="card p-6">
          <h3 className="text-white font-semibold mb-4">By Category</h3>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    paddingAngle={3} dataKey="value">
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '12px', color: '#e2e8f0' }}
                    formatter={(v: any) => [formatCurrency(v), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">
                {categoryData.slice(0, 4).map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[c.name] || '#64748b' }} />
                      <span className="text-slate-400">{c.name}</span>
                    </div>
                    <span className="text-white font-medium">{formatCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">No data yet</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent transactions */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Recent Transactions</h3>
            <Link href="/transactions" className="text-brand-400 text-sm hover:text-brand-300">View all</Link>
          </div>
          {recentTx.length > 0 ? (
            <div className="space-y-3">
              {recentTx.map((tx: any) => (
                <div key={tx._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-hover transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: `${CATEGORY_COLORS[tx.category] || '#64748b'}20` }}>
                    {getCategoryEmoji(tx.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{tx.title}</div>
                    <div className="text-xs text-slate-500">{formatDate(tx.date)}</div>
                  </div>
                  <div className="text-sm font-semibold text-red-400">-{formatCurrency(tx.amount)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No transactions yet
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-4.5 h-4.5 text-brand-400" />
              <h3 className="text-white font-semibold">AI Insights</h3>
            </div>
            <button onClick={fetchAiInsights} disabled={aiLoading}
              className="btn-ghost text-xs px-3 py-1.5">
              {aiLoading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border border-slate-500 border-t-white rounded-full animate-spin" />
                  Analyzing…
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Analyze
                </span>
              )}
            </button>
          </div>

          {aiInsights ? (
            <div className="space-y-3">
              {aiInsights.insights?.map((insight: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-surface-hover border border-surface-border">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{insight.emoji || '💡'}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{insight.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{insight.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-3">
                <Brain className="w-7 h-7 text-brand-400" />
              </div>
              <p className="text-slate-400 text-sm">Click &quot;Analyze&quot; to get AI-powered</p>
              <p className="text-slate-500 text-xs mt-1">spending insights &amp; recommendations</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getCategoryEmoji(category: string) {
  const map: Record<string, string> = {
    Food: '🍔', Travel: '✈️', Bills: '📄',
    Shopping: '🛍️', Health: '💊', Entertainment: '🎬', Other: '📦'
  }
  return map[category] || '💳'
}

// Suppress TS error for unused import
import { CreditCard } from 'lucide-react'
