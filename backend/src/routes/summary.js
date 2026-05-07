const express = require('express')
const Expense = require('../models/Expense')
const Settings = require('../models/Settings')
const auth = require('../middleware/auth')
const router = express.Router()

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay())

    const allThisMonth = await Expense.find({ userId, date: { $gte: startOfMonth } })
    const allLastMonth = await Expense.find({ userId, date: { $gte: startOfLastMonth, $lte: endOfLastMonth } })
    const thisWeek = await Expense.find({ userId, date: { $gte: startOfWeek } })

    const monthTotal = allThisMonth.reduce((s, e) => s + e.amount, 0)
    const lastMonthTotal = allLastMonth.reduce((s, e) => s + e.amount, 0)
    const weekTotal = thisWeek.reduce((s, e) => s + e.amount, 0)
    const monthChange = lastMonthTotal > 0 ? Math.round(((monthTotal - lastMonthTotal) / lastMonthTotal) * 100) : 0

    const daysInMonth = now.getDate()
    const dailyAvg = daysInMonth > 0 ? monthTotal / daysInMonth : 0

    // By category this month
    const byCategory = allThisMonth.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    }, {})

    // Monthly trend (last 6 months)
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const expenses = await Expense.find({ userId, date: { $gte: d, $lte: end } })
      monthlyTrend.push({
        month: d.toLocaleString('default', { month: 'short' }),
        amount: expenses.reduce((s, e) => s + e.amount, 0),
      })
    }

    // Budget used
    const settings = await Settings.findOne({ userId })
    const budgetUsed = settings?.monthlyBudget > 0
      ? Math.round((monthTotal / settings.monthlyBudget) * 100)
      : 0

    res.json({ monthTotal, lastMonthTotal, monthChange, weekTotal, dailyAvg, byCategory, monthlyTrend, budgetUsed })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router
