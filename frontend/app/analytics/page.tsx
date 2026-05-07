'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Brain, TrendingUp, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b']

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [prediction, setPrediction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [predLoading, setPredLoading] = useState(false)

  useEffect(() => {
    api.get('/analytics').then(({ data }) => setAnalytics(data))
      .catch(() => toast.error('Analytics load failed'))
      .finally(() => setLoading(false))
  }, [])

  const fetchPrediction = async () => {
    setPredLoading(true)
    try {
      const { data } = await api.get('/ai/predict')
      setPrediction(data)
    } catch { toast.error('Prediction unavailable') }
    finally { setPredLoading(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Deep dive into your spending patterns</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Highest Day', value: formatCurrency(analytics?.highestDay?.amount || 0), sub: analytics?.highestDay?.date || '-' },
          { label: 'Avg / Month', value: formatCurrency(analytics?.avgMonth || 0), sub: 'last 6 months' },
          { label: 'Top Category', value: analytics?.topCategory || '-', sub: 'most spending' },
          { label: 'Total Expenses', value: String(analytics?.totalCount || 0), sub: 'transactions' },
        ].map((s, i) => (
          <div key={i} className="card p-5">
            <div className="text-xs text-slate-500 mb-2">{s.label}</div>
            <div className="text-xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Monthly line chart */}
      <div className="card p-6">
        <h3 className="text-white font-semibold mb-6">6-Month Spending Trend</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={analytics?.monthly || []}>
            <XAxis dataKey="month" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false}
              tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
            <Tooltip contentStyle={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '12px', color: '#e2e8f0' }}
              formatter={(v: any) => [formatCurrency(v), 'Spent']} />
            <Line type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2.5}
              dot={{ fill: '#22c55e', r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly bar chart */}
        <div className="card p-6">
          <h3 className="text-white font-semibold mb-6">Weekly Spending</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics?.weekly || []}>
              <XAxis dataKey="week" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip contentStyle={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '12px', color: '#e2e8f0' }}
                formatter={(v: any) => [formatCurrency(v), 'Spent']} />
              <Bar dataKey="amount" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="card p-6">
          <h3 className="text-white font-semibold mb-6">Category Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={analytics?.byCategory || []} cx="50%" cy="50%" outerRadius={85} paddingAngle={3} dataKey="amount">
                {(analytics?.byCategory || []).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: '12px', color: '#e2e8f0' }}
                formatter={(v: any) => [formatCurrency(v), '']} />
              <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Prediction */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-brand-400" />
            <h3 className="text-white font-semibold">AI Expense Prediction</h3>
            <span className="badge bg-brand-500/15 text-brand-400 text-xs">Beta</span>
          </div>
          <button onClick={fetchPrediction} disabled={predLoading} className="btn-primary text-sm">
            {predLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Predicting…
              </span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Predict Next Month
              </>
            )}
          </button>
        </div>

        {prediction ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
              <div className="text-xs text-brand-300 mb-1">Predicted Total</div>
              <div className="text-2xl font-bold text-brand-400">{formatCurrency(prediction.predictedTotal)}</div>
              <div className="text-xs text-slate-400 mt-1">next month</div>
            </div>
            <div className="lg:col-span-2 space-y-2">
              {prediction.categoryBreakdown?.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-hover">
                  <span className="text-sm text-slate-300">{c.category}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-surface-border rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${c.percentage}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-white w-20 text-right">{formatCurrency(c.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <TrendingUp className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-slate-500 text-sm">Click &quot;Predict Next Month&quot; to forecast your spending</p>
          </div>
        )}
      </div>
    </div>
  )
}
