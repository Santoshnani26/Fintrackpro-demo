import { format, parseISO } from 'date-fns'

export const CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Other']

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy')
  } catch {
    return dateStr
  }
}

export function groupByDate(expenses: any[]) {
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  return expenses.reduce((groups: Record<string, any[]>, expense) => {
    const d = new Date(expense.date).toDateString()
    const label = d === today ? 'Today' : d === yesterday ? 'Yesterday' : format(new Date(expense.date), 'MMMM d, yyyy')
    if (!groups[label]) groups[label] = []
    groups[label].push(expense)
    return groups
  }, {})
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Food: '#22c55e', Travel: '#3b82f6', Bills: '#f59e0b',
    Shopping: '#8b5cf6', Health: '#ec4899', Entertainment: '#06b6d4', Other: '#64748b',
  }
  return colors[category] || '#64748b'
}
