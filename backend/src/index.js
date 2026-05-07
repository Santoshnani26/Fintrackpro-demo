require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const mongoose = require('mongoose')
const rateLimit = require('express-rate-limit')
const serverless = require('serverless-http')

const authRoutes = require('./routes/auth')
const expenseRoutes = require('./routes/expenses')
const summaryRoutes = require('./routes/summary')
const analyticsRoutes = require('./routes/analytics')
const exportRoutes = require('./routes/export')
const settingsRoutes = require('./routes/settings')
const aiRoutes = require('./routes/ai')

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet())
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://fintrackpro-demo.vercel.app',
    'https://fintrackpro-demo-a5yinqtas-santoshnani26s-projects.vercel.app'
  ],
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 })
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 })
app.use('/api', limiter)
app.use('/api/auth', authLimiter)

app.get('/', (req, res) => {
  res.send('Backend Running')
})

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    throw err;
  }
};
// Run DB connection before handling requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/summary', summaryRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/export', exportRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/ai', aiRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// Error handler


// Start local server
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 5000, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to start server:", err.message);
  });

module.exports = app;