/**
 * Seed Script — creates a demo user and sample expenses
 * Run: node seed.js
 */
require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fintrack'

const userSchema = new mongoose.Schema({ name: String, email: String, password: String })
const expenseSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  title: String, amount: Number, category: String,
  date: Date, notes: String,
})
const User = mongoose.model('User', userSchema)
const Expense = mongoose.model('Expense', expenseSchema)

const categories = ['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Other']
const titles = {
  Food: ['Grocery Store', 'Pizza Hut', 'McDonald\'s', 'Cafe Coffee Day', 'Swiggy Order', 'Zomato Delivery'],
  Travel: ['Uber Ride', 'Ola Cab', 'Bus Ticket', 'Train Ticket', 'Flight Booking', 'Petrol'],
  Bills: ['Electricity Bill', 'Internet Bill', 'Mobile Recharge', 'Netflix', 'Spotify', 'Gas Bill'],
  Shopping: ['Amazon Order', 'Flipkart', 'Myntra', 'Clothing Store', 'Electronics', 'Books'],
  Health: ['Pharmacy', 'Doctor Visit', 'Gym Membership', 'Health Supplement', 'Lab Test'],
  Entertainment: ['Movie Ticket', 'Concert', 'Gaming', 'Theme Park', 'OTT Subscription'],
  Other: ['Miscellaneous', 'Gift', 'Donation', 'ATM Withdrawal'],
}

function randBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

async function seed() {
  await mongoose.connect(MONGO_URI)
  console.log('Connected to MongoDB')

  // Clear old data
  await User.deleteMany({ email: 'demo@fintrack.com' })

  // Create demo user
  const hashedPw = await bcrypt.hash('demo1234', 12)
  const user = await User.create({ name: 'Demo User', email: 'demo@fintrack.com', password: hashedPw })
  console.log('Demo user created:', user.email)

  // Clear old expenses for this user
  await Expense.deleteMany({ userId: user._id })

  // Generate 6 months of expenses
  const expenses = []
  const now = new Date()
  for (let monthsBack = 5; monthsBack >= 0; monthsBack--) {
    const numExpenses = randBetween(15, 25)
    for (let i = 0; i < numExpenses; i++) {
      const category = categories[randBetween(0, categories.length - 1)]
      const titleList = titles[category]
      const date = new Date(now.getFullYear(), now.getMonth() - monthsBack, randBetween(1, 28))
      expenses.push({
        userId: user._id,
        title: titleList[randBetween(0, titleList.length - 1)],
        amount: randBetween(100, 5000),
        category,
        date,
        notes: '',
      })
    }
  }

  await Expense.insertMany(expenses)
  console.log(`✅ Seeded ${expenses.length} expenses`)
  console.log('\n🎉 Done! Login with:')
  console.log('   Email:    demo@fintrack.com')
  console.log('   Password: demo1234')

  await mongoose.disconnect()
}

seed().catch(err => { console.error(err); process.exit(1) })
