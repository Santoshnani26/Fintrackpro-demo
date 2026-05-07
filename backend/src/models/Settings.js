const mongoose = require('mongoose')

const settingsSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  monthlyBudget:   { type: Number, default: 0 },
  categoryBudgets: { type: Map, of: Number, default: {} },
  alerts: {
    enabled:   { type: Boolean, default: true },
    threshold: { type: Number, default: 80 },
  },
}, { timestamps: true })

module.exports = mongoose.model('Settings', settingsSchema)
