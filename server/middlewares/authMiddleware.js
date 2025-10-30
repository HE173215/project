const jwt = require('jsonwebtoken')
const User = require('../models/User')

// Middleware xác thực token
exports.protect = async (req, res, next) => {
  try {
    let token

    // Ưu tiên: Đọc token từ HTTP-only cookie
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token
    }
    // Fallback: Đọc từ Authorization header (cho mobile apps, Postman)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]
    }

    // Kiểm tra token có tồn tại không
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không có quyền truy cập. Vui lòng đăng nhập'
      })
    }

    try {
      // Xác thực token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Lấy thông tin user từ token - chỉ select các fields cần thiết
      const user = await User.findById(decoded.id)
        .select('_id username email role isActive isBlocked isVerified avatar fullName')
        .lean() // Return plain JS object for better performance

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User không tồn tại'
        })
      }

      // Kiểm tra tài khoản có bị khóa không
      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản đã bị khóa'
        })
      }

      // Kiểm tra tài khoản có active không
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản không hoạt động'
        })
      }

      // Gán user vào request
      req.user = user
      next()
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      })
    }
  } catch (error) {
    console.error('❌ Lỗi auth middleware:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// Middleware kiểm tra role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' không có quyền truy cập`
      })
    }
    next()
  }
}

// Middleware kiểm tra tài khoản đã xác thực email chưa
exports.requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Vui lòng xác thực email trước'
    })
  }
  next()
}
