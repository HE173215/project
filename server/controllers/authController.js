const User = require('../models/User')
const jwt = require('jsonwebtoken')
const emailService = require('../services/emailService')

// Tạo JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d' // Token hết hạn sau 7 ngày
  })
}

// Helper: Set token cookie
const setTokenCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true, // Không thể truy cập từ JavaScript (XSS protection)
    secure: process.env.NODE_ENV === 'production', // Chỉ HTTPS trong production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // ✅ ĐỔI 'strict' → 'none'
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  }
  
  res.cookie('token', token, cookieOptions)
}

// @desc    Đăng ký user mới
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password, fullName, phone } = req.body

    // Kiểm tra các trường bắt buộc
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ username, email và password'
      })
    }

    // Kiểm tra user đã tồn tại chưa - chỉ cần check existence
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    })
      .select('_id email username')
      .lean() // Lightweight query for existence check

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email đã được sử dụng' 
          : 'Username đã được sử dụng'
      })
    }

    // Tạo user mới
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      phone
    })

    // Tạo OTP để xác thực email
    const otp = user.generateOTP()
    await user.save()

    // Gửi OTP qua email
    await emailService.sendOTPRegistration(email, username, otp)
    console.log(`📧 OTP đã gửi đến ${email}: ${otp}`)

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực OTP',
      data: {
        userId: user._id,
        email: user.email,
        // Chỉ để dev, xóa trong production
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      }
    })
  } catch (error) {
    console.error('❌ Lỗi register:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Xác thực OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email và OTP'
      })
    }

    // Tìm user - cần full document để verify OTP
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      })
    }

    // Xác thực OTP
    const result = user.verifyOTP(otp)

    if (!result.success) {
      await user.save() // Lưu số lần thử
      return res.status(400).json(result)
    }

    // Lưu trạng thái verified
    await user.save()

    // Gửi email chào mừng
    await emailService.sendWelcomeEmail(user.email, user.username)

    // Tạo token và set cookie
    const token = generateToken(user._id)
    setTokenCookie(res, token)

    res.status(200).json({
      success: true,
      message: 'Xác thực thành công',
      data: {
        user
        // Token không trả về trong response, đã lưu trong cookie
      }
    })
  } catch (error) {
    console.error('❌ Lỗi verify OTP:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Gửi lại OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email'
      })
    }

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      })
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản đã được xác thực'
      })
    }

    // Tạo OTP mới
    const otp = user.generateOTP()
    await user.save()

    // Gửi OTP qua email
    await emailService.sendOTPRegistration(email, user.username, otp)
    console.log(`📧 OTP mới đã gửi đến ${email}: ${otp}`)

    res.status(200).json({
      success: true,
      message: 'OTP mới đã được gửi đến email',
      data: {
        // Chỉ để dev
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      }
    })
  } catch (error) {
    console.error('❌ Lỗi resend OTP:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Đăng nhập
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email và password'
      })
    }

    // Tìm user - cần password để verify login
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc password không đúng'
      })
    }

    // Kiểm tra password
    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc password không đúng'
      })
    }

    // Kiểm tra tài khoản đã xác thực chưa
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Vui lòng xác thực email trước khi đăng nhập',
        requireVerification: true
      })
    }

    // Kiểm tra tài khoản có bị khóa không
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa'
      })
    }

    // Cập nhật thời gian đăng nhập (không trigger password hash)
    user.lastLogin = new Date()
    await user.save({ validateBeforeSave: false })

    // Tạo token và set cookie
    const token = generateToken(user._id)
    setTokenCookie(res, token)

    // Lấy user data không có password để trả về
    const userResponse = await User.findById(user._id)

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: userResponse
        // Token không trả về trong response, đã lưu trong cookie
      }
    })
  } catch (error) {
    console.error('❌ Lỗi login:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Đăng xuất
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  try {
    // Clear cookie
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0), // Expire immediately
      path: '/'
    })

    res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công'
    })
  } catch (error) {
    console.error('❌ Lỗi logout:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Lấy thông tin user hiện tại
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // req.user đã được set bởi protect middleware với _id
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      })
    }

    res.status(200).json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('❌ Lỗi getMe:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Quên mật khẩu - Gửi OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email'
      })
    }

    // Tìm user - cần full document để generate OTP
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user với email này'
      })
    }

    // Tạo OTP mới
    const otp = user.generateOTP()
    await user.save()

    // Gửi OTP qua email
    await emailService.sendOTPResetPassword(email, user.username, otp)

    res.status(200).json({
      success: true,
      message: 'OTP đã được gửi đến email',
      data: {
        // Chỉ để dev
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      }
    })
  } catch (error) {
    console.error('❌ Lỗi forgot password:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Reset mật khẩu với OTP
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email, OTP và mật khẩu mới'
      })
    }

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      })
    }

    // Xác thực OTP
    const result = user.verifyOTP(otp)

    if (!result.success) {
      await user.save()
      return res.status(400).json(result)
    }

    // Cập nhật password mới
    user.password = newPassword
    await user.save()

    // Gửi email thông báo đổi mật khẩu
    await emailService.sendPasswordChangedEmail(user.email, user.username)

    res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    })
  } catch (error) {
    console.error('❌ Lỗi reset password:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}
