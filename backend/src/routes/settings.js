const express = require('express')
const Settings = require('../models/Settings')
const auth = require('../middleware/auth')
const router = express.Router()

router.get('/', auth, async (req, res) => {
  try {
    const settings = await Settings.findOne({ userId: req.user._id }) || {}
    res.json(settings)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { userId: req.user._id },
      { ...req.body, userId: req.user._id },
      { new: true, upsert: true }
    )
    res.json(settings)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
