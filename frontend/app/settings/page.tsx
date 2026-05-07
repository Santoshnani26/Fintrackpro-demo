'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { formatCurrency, CATEGORIES } from '@/lib/utils'
import { Save, Target, Bell, User, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [budgets, setBudgets] = useState<Record<string, number>>({})
  const [monthlyBudget, setMonthlyBudget] = useState('')
  const [alerts, setAlerts] = useState({ enabled: true, threshold: 80 })
  const [profile, setProfile] = useState({ name: '', email: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) setProfile(JSON.parse(user))
    api.get('/settings').then(({ data }) => {
      setBudgets(data.categoryBudgets || {})
      setMonthlyBudget(String(data.monthlyBudget || ''))
      setAlerts(data.alerts || { enabled: true, threshold: 80 })
    }).catch(() => {})
  }, [])

  const handleSaveBudgets = async () => {
    setSaving(true)
    try {
      await api.post('/settings', { monthlyBudget: parseFloat(monthlyBudget) || 0, categoryBudgets: budgets, alerts })
      toast.success('Settings saved!')
    } catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure your budget limits and preferences</p>
      </div>

      {/* Profile */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4.5 h-4.5 text-brand-400" />
          <h2 className="text-white font-semibold">Profile</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={profile.email} disabled />
          </div>
        </div>
      </div>

      {/* Monthly budget */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Target className="w-4.5 h-4.5 text-brand-400" />
          <h2 className="text-white font-semibold">Monthly Budget</h2>
        </div>
        <div>
          <label className="label">Total Monthly Limit (₹)</label>
          <input className="input max-w-xs" type="number" placeholder="e.g. 50000"
            value={monthlyBudget} onChange={e => setMonthlyBudget(e.target.value)} />
          <p className="text-xs text-slate-500 mt-2">You'll be alerted when spending exceeds {alerts.threshold}% of this limit</p>
        </div>
      </div>

      {/* Category budgets */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-4.5 h-4.5 text-brand-400" />
          <h2 className="text-white font-semibold">Category Budgets</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CATEGORIES.map(cat => (
            <div key={cat}>
              <label className="label">{cat} (₹)</label>
              <input className="input" type="number" placeholder="No limit"
                value={budgets[cat] || ''}
                onChange={e => setBudgets({ ...budgets, [cat]: parseFloat(e.target.value) || 0 })} />
            </div>
          ))}
        </div>
      </div>

      {/* Alert settings */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="w-4.5 h-4.5 text-brand-400" />
          <h2 className="text-white font-semibold">Alert Settings</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">Budget Alerts</div>
              <div className="text-xs text-slate-500">Get notified when approaching budget limit</div>
            </div>
            <button
              onClick={() => setAlerts({ ...alerts, enabled: !alerts.enabled })}
              className={`w-12 h-6 rounded-full transition-colors relative ${alerts.enabled ? 'bg-brand-500' : 'bg-surface-border'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${alerts.enabled ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
          <div>
            <label className="label">Alert Threshold: {alerts.threshold}%</label>
            <input type="range" min={50} max={100} step={5}
              value={alerts.threshold}
              onChange={e => setAlerts({ ...alerts, threshold: parseInt(e.target.value) })}
              className="w-full accent-brand-500" />
          </div>
        </div>
      </div>

      <button onClick={handleSaveBudgets} className="btn-primary" disabled={saving}>
        {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
        Save Settings
      </button>
    </div>
  )
}
