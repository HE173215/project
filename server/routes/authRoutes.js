const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { protect } = require('../middlewares/authMiddleware')
const { authLimiter, strictLimiter } = require('../middlewares/securityMiddleware')

// Public routes with rate limiting
router.post('/register', authLimiter, authController.register)
router.post('/login', authLimiter, authController.login)
router.post('/verify-otp', authLimiter, authController.verifyOTP)
router.post('/resend-otp', strictLimiter, authController.resendOTP)
router.post('/forgot-password', strictLimiter, authController.forgotPassword)
router.post('/reset-password', authLimiter, authController.resetPassword)

// Protected routes
router.get('/me', protect, authController.getMe)
router.post('/logout', protect, authController.logout)

module.exports = router
