const express = require('express')
const Expense = require('../models/Expense')
const auth = require('../middleware/auth')
const router = express.Router()

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id
    const now = new Date()

    // 6-month monthly data
    const monthly = []
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const expenses = await Expense.find({ userId, date: { $gte: start, $lte: end } })
      monthly.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        amount: expenses.reduce((s, e) => s + e.amount, 0),
      })
    }

    // Weekly data (last 8 weeks)
    const weekly = []
    for (let i = 7; i >= 0; i--) {
      const start = new Date(now); start.setDate(now.getDate() - (i + 1) * 7)
      const end = new Date(now); end.setDate(now.getDate() - i * 7)
      const expenses = await Expense.find({ userId, date: { $gte: start, $lte: end } })
      weekly.push({
        week: `W${8 - i}`,
        amount: expenses.reduce((s, e) => s + e.amount, 0),
      })
    }

    // Category breakdown (all time)
    const allExpenses = await Expense.find({ userId })
    const catMap = {}    
    allExpenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount })
    const byCategory = Object.entries(catMap).map(([name, amount]) => ({ name, amount }))

    // Top category
    const topCategory = byCategory.sort((a, b) => b.amount - a.amount)[0]?.name || '-'

    // Avg per month
    const avgMonth = monthly.reduce((s, m) => s + m.amount, 0) / monthly.length

    // Highest day
    const pipeline = [
      { $match: { userId } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, amount: { $sum: '$amount' } } },
      { $sort: { amount: -1 } },
      { $limit: 1 },
    ]
    const [highestDayRes] = await Expense.aggregate(pipeline)
    const highestDay = highestDayRes
      ? { date: highestDayRes._id, amount: highestDayRes.amount }
      : { date: '-', amount: 0 }

    const totalCount = allExpenses.length

    res.json({ monthly, weekly, byCategory, topCategory, avgMonth, highestDay, totalCount })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router
