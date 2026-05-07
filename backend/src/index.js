require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const summaryRoutes = require('./routes/summary');
const analyticsRoutes = require('./routes/analytics');
const exportRoutes = require('./routes/export');
const settingsRoutes = require('./routes/settings');
const aiRoutes = require('./routes/ai');

const app = express();

// Security middleware
app.use(helmet());

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://fintrackpro-demo.vercel.app',
    'https://fintrackpro-demo-a5yinqtas-santoshnani26s-projects.vercel.app'
  ],
  credentials: true,
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
});

app.use('/api', limiter);
app.use('/api/auth', authLimiter);

// MongoDB Connection
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    throw err;
  }
};

// Connect DB before every request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Test route
app.get('/', (req, res) => {
  res.send('Backend Running');
});

// Health route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ai', aiRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: 'Server Error',
  });
});

module.exports = app;