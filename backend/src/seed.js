/**
 * Seed script — creates a demo user and sample expenses.
 * Run: node src/seed.js
 */
require('dotenv').config()
const mongoose = require('mongoose')
const User = require('./models/User')
const Expense = require('./models/Expense')
const Settings = require('./models/Settings')

const DEMO_EMAIL = 'demo@fintrack.com'
const DEMO_PASS = 'demo1234'

const categories = ['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Other']

function rand(min, max) {
  return Math.round(Math.random() * (max - min) + min)
}

function randomDate(monthsAgo) {
  const d = new Date()
  d.setMonth(d.getMonth() - monthsAgo)
  d.setDate(rand(1, 28))
  return d
}

const sampleExpenses = [
  // This month
  { title: 'Grocery Shopping', category: 'Food', amount: 2400, monthsAgo: 0 },
  { title: 'Electricity Bill', category: 'Bills', amount: 1800, monthsAgo: 0 },
  { title: 'Uber to Airport', category: 'Travel', amount: 650, monthsAgo: 0 },
  { title: 'Netflix Subscription', category: 'Entertainment', amount: 649, monthsAgo: 0 },
  { title: 'Gym Membership', category: 'Health', amount: 1200, monthsAgo: 0 },
  { title: 'Amazon Order', category: 'Shopping', amount: 3200, monthsAgo: 0 },
  { title: 'Pizza Dinner', category: 'Food', amount: 820, monthsAgo: 0 },
  { title: 'Internet Bill', category: 'Bills', amount: 999, monthsAgo: 0 },
  // Last month
  { title: 'Grocery Shopping', category: 'Food', amount: 2100, monthsAgo: 1 },
  { title: 'Mobile Recharge', category: 'Bills', amount: 399, monthsAgo: 1 },
  { title: 'Movie Tickets', category: 'Entertainment', amount: 540, monthsAgo: 1 },
  { title: 'Doctor Visit', category: 'Health', amount: 500, monthsAgo: 1 },
  { title: 'Flight Ticket', category: 'Travel', amount: 5200, monthsAgo: 1 },
  { title: 'Swiggy Order', category: 'Food', amount: 450, monthsAgo: 1 },
  // 2 months ago
  { title: 'Grocery Shopping', category: 'Food', amount: 1950, monthsAgo: 2 },
  { title: 'Electricity Bill', category: 'Bills', amount: 1650, monthsAgo: 2 },
  { title: 'Clothes Shopping', category: 'Shopping', amount: 4500, monthsAgo: 2 },
  { title: 'Spotify Premium', category: 'Entertainment', amount: 119, monthsAgo: 2 },
  // 3 months ago
  { title: 'Grocery Shopping', category: 'Food', amount: 2200, monthsAgo: 3 },
  { title: 'Petrol', category: 'Travel', amount: 1200, monthsAgo: 3 },
  { title: 'Medicines', category: 'Health', amount: 780, monthsAgo: 3 },
  // 4 months ago
  { title: 'Grocery Shopping', category: 'Food', amount: 1800, monthsAgo: 4 },
  { title: 'New Phone Case', category: 'Shopping', amount: 299, monthsAgo: 4 },
  { title: 'Zomato Orders', category: 'Food', amount: 1200, monthsAgo: 4 },
  // 5 months ago
  { title: 'Grocery Shopping', category: 'Food', amount: 2050, monthsAgo: 5 },
  { title: 'Bus Pass', category: 'Travel', amount: 800, monthsAgo: 5 },
  { title: 'Books', category: 'Other', amount: 650, monthsAgo: 5 },
]

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fintrack')
  console.log('✅ Connected to MongoDB')

  // Remove existing demo user
  const existing = await User.findOne({ email: DEMO_EMAIL })
  if (existing) {
    await Expense.deleteMany({ userId: existing._id })
    await Settings.deleteMany({ userId: existing._id })
    await User.deleteOne({ _id: existing._id })
    console.log('🗑️  Removed existing demo user')
  }

  // Create demo user
  const user = await User.create({ name: 'Demo User', email: DEMO_EMAIL, password: DEMO_PASS })
  console.log(`👤 Created demo user: ${DEMO_EMAIL} / ${DEMO_PASS}`)

  // Create expenses
  const expenses = sampleExpenses.map(e => ({
    userId: user._id,
    title: e.title,
    category: e.category,
    amount: e.amount,
    date: randomDate(e.monthsAgo),
    notes: '',
  }))
  await Expense.insertMany(expenses)
  console.log(`💸 Inserted ${expenses.length} sample expenses`)

  // Create default settings
  await Settings.create({
    userId: user._id,
    monthlyBudget: 25000,
    categoryBudgets: { Food: 5000, Travel: 3000, Bills: 5000, Shopping: 4000, Health: 2000, Entertainment: 2000 },
    alerts: { enabled: true, threshold: 80 },
  })
  console.log('⚙️  Created default settings')

  console.log('\n✨ Seed complete! Login with:')
  console.log(`   Email: ${DEMO_EMAIL}`)
  console.log(`   Password: ${DEMO_PASS}`)
  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
