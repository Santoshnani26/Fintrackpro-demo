const mongoose = require('mongoose')

const expenseSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:    { type: String, required: true, trim: true },
  amount:   { type: Number, required: true, min: 0 },
  category: { type: String, required: true, enum: ['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Other'], default: 'Other' },
  date:     { type: Date, required: true, default: Date.now },
  notes:    { type: String, trim: true, default: '' },
}, { timestamps: true })

// Index for efficient queries
expenseSchema.index({ userId: 1, date: -1 })
expenseSchema.index({ userId: 1, category: 1 })

module.exports = mongoose.model('Expense', expenseSchema)
