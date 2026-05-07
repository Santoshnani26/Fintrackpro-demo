const express = require('express')
const axios = require('axios')
const Expense = require('../models/Expense')
const auth = require('../middleware/auth')
const router = express.Router()

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

// GET /api/ai/insights
router.get('/insights', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user._id }).sort({ date: -1 }).limit(100)
    const { data } = await axios.post(`${AI_URL}/agents/analyze`, { expenses })
    res.json(data)
  } catch (err) {
    // Fallback: return mock insights if AI service is down
    res.json({
      insights: [
        { emoji: '📊', title: 'Spending Analysis', description: 'Connect AI service for personalized insights.' },
        { emoji: '💡', title: 'Tip', description: 'Track your daily expenses to better understand your habits.' },
      ]
    })
  }
})

// GET /api/ai/predict
router.get('/predict', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user._id }).sort({ date: -1 }).limit(200)
    const { data } = await axios.post(`${AI_URL}/agents/predict`, { expenses })
    res.json(data)
  } catch (err) {
    // Fallback mock prediction
    const totalSpent = expenses ? expenses.reduce((s, e) => s + e.amount, 0) : 0
    const avgMonthly = totalSpent / 3
    res.json({
      predictedTotal: Math.round(avgMonthly * 1.05),
      confidence: 0.75,
      categoryBreakdown: [
        { category: 'Food', amount: Math.round(avgMonthly * 0.35), percentage: 35 },
        { category: 'Bills', amount: Math.round(avgMonthly * 0.25), percentage: 25 },
        { category: 'Travel', amount: Math.round(avgMonthly * 0.20), percentage: 20 },
        { category: 'Other', amount: Math.round(avgMonthly * 0.20), percentage: 20 },
      ]
    })
  }
})

// GET /api/ai/recommend
router.get('/recommend', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user._id }).sort({ date: -1 }).limit(100)
    const { data } = await axios.post(`${AI_URL}/agents/recommend`, { expenses })
    res.json(data)
  } catch (err) {
    res.json({
      recommendations: [
        { title: 'Review subscriptions', description: 'Check for unused subscriptions in Bills category.' },
        { title: 'Meal planning', description: 'Reducing Food expenses by planning meals can save up to 30%.' },
      ]
    })
  }
})

module.exports = router
