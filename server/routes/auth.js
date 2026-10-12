const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { body, param } = require('express-validator')
const Admin = require('../models/Admin')
const authenticate = require('../middleware/auth')
const rateLimit = require('express-rate-limit')

// Rate limited login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again after 15 minutes',
})

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body

    const admin = await Admin.findOne({ email })
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    const isMatch = await admin.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    if (!admin.isActive) {
      return res.status(401).json({ success: false, message: 'Account is disabled' })
    }

    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    })

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.get('/me', authenticate, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password')
    res.json({ success: true, admin })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.post('/logout', authenticate, (req, res) => {
  res.clearCookie('jwt')
  res.json({ success: true, message: 'Logged out successfully' })
})

module.exports = router