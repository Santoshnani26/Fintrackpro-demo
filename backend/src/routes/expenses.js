const express = require('express')
const Joi = require('joi')
const Expense = require('../models/Expense')
const auth = require('../middleware/auth')
const router = express.Router()

const expenseSchema = Joi.object({
  title:    Joi.string().min(1).max(200).required(),
  amount:   Joi.number().positive().required(),
  category: Joi.string().valid('Food','Travel','Bills','Shopping','Health','Entertainment','Other').required(),
  date:     Joi.date().required(),
  notes:    Joi.string().max(500).allow('').optional(),
})

// GET /api/expenses — list with pagination, search, filter
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 15, search, category, minAmount, maxAmount, startDate, endDate } = req.query
    const query = { userId: req.user._id }

    if (search) query.title = { $regex: search, $options: 'i' }
    if (category) query.category = category
    if (minAmount || maxAmount) {
      query.amount = {}
      if (minAmount) query.amount.$gte = parseFloat(minAmount)
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount)
    }
    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) query.date.$lte = new Date(endDate + 'T23:59:59')
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [expenses, total] = await Promise.all([
      Expense.find(query).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      Expense.countDocuments(query),
    ])
    res.json({ expenses, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// POST /api/expenses — create
router.post('/', auth, async (req, res) => {
  const { error } = expenseSchema.validate(req.body)
  if (error) return res.status(400).json({ message: error.details[0].message })
  try {
    const expense = await Expense.create({ ...req.body, userId: req.user._id })
    res.status(201).json(expense)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// PUT /api/expenses/:id — update
router.put('/:id', auth, async (req, res) => {
  const { error } = expenseSchema.validate(req.body)
  if (error) return res.status(400).json({ message: error.details[0].message })
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    )
    if (!expense) return res.status(404).json({ message: 'Not found' })
    res.json(expense)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// DELETE /api/expenses/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!expense) return res.status(404).json({ message: 'Not found' })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router
