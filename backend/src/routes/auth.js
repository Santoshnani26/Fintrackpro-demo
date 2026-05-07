const express = require('express')
const jwt = require('jsonwebtoken')
const Joi = require('joi')
const User = require('../models/User')
const router = express.Router()

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' })

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const schema = Joi.object({
    name:     Joi.string().min(2).max(50).required(),
    email:    Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  })
  const { error } = schema.validate(req.body)
  if (error) return res.status(400).json({ message: error.details[0].message })

  try {
    const existing = await User.findOne({ email: req.body.email })
    if (existing) return res.status(409).json({ message: 'Email already registered' })

    const user = await User.create(req.body)
    const token = signToken(user._id)
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' })

  try {
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })

    const valid = await user.comparePassword(password)
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' })

    const token = signToken(user._id)
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router
