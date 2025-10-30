const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { protect } = require('../middlewares/authMiddleware');
const {
  googleAuth,
  googleCallback,
  linkGoogleAccount,
  unlinkGoogleAccount
} = require('../controllers/googleAuthController');

/**
 * @route   POST /api/auth/google
 * @desc    Đăng nhập/đăng ký với Google (sử dụng token từ frontend)
 * @access  Public
 */
router.post('/google', googleAuth);

/**
 * @route   GET /api/auth/google/redirect
 * @desc    Redirect đến Google OAuth (Passport strategy)
 * @access  Public
 */
router.get('/google/redirect', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      success: false,
      message: 'Google OAuth chưa được cấu hình. Vui lòng thêm GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET vào .env'
    });
  }
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/login?error=google_not_configured`);
  }
  passport.authenticate('google', {
    failureRedirect: '/auth/login?error=google_auth_failed',
    session: false
  })(req, res, next);
}, googleCallback);

/**
 * @route   POST /api/auth/google/link
 * @desc    Liên kết tài khoản Google với tài khoản hiện tại
 * @access  Private
 */
router.post('/google/link', protect, linkGoogleAccount);

/**
 * @route   DELETE /api/auth/google/unlink
 * @desc    Hủy liên kết tài khoản Google
 * @access  Private
 */
router.delete('/google/unlink', protect, unlinkGoogleAccount);

module.exports = router;
