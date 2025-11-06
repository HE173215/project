const User = require('../models/User')
const emailService = require('../services/emailService')

// @desc    Tạo user mới (Admin only)
// @route   POST /api/users/create
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, fullName, phone, role } = req.body

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email và password là bắt buộc'
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email đã được sử dụng' 
          : 'Username đã được sử dụng'
      })
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      phone,
      role: role || 'student',
      isVerified: false // Admin-created users need email verification
    })

    // Tạo OTP để xác thực email
    const otp = user.generateOTP()
    await user.save()

    // Gửi OTP qua email
    await emailService.sendOTPRegistration(email, username, otp)
    console.log(`📧 OTP đã gửi đến ${email}: ${otp}`)

    res.status(201).json({
      success: true,
      message: 'Tạo người dùng thành công. Vui lòng kiểm tra email để xác thực OTP',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      }
    })
  } catch (error) {
    console.error('❌ Lỗi createUser:', error)
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi tạo người dùng',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// @desc    Lấy tất cả users
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 100
    const skip = (page - 1) * limit

    // Search/filter parameters
    const search = req.query.search || ''
    const role = req.query.role
    const isBlocked = req.query.isBlocked

    // Build query
    const query = {}
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (role) {
      query.role = role
    }
    
    if (isBlocked !== undefined) {
      query.isBlocked = isBlocked === 'true'
    }

    // Execute query with pagination and field selection
    const users = await User.find(query)
      .select('-password -otp -resetPasswordToken -resetPasswordExpires -verificationToken')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 })
      .lean() // Return plain JS objects for better performance

    // Get total count for pagination
    const total = await User.countDocuments(query)

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: users
    })
  } catch (error) {
    console.error('❌ Lỗi getAllUsers:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Lấy user theo ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    // Select only necessary fields, exclude sensitive data
    const user = await User.findById(req.params.id)
      .select('-password -otp -resetPasswordToken -resetPasswordExpires -verificationToken')
      .lean()

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      })
    }

    // SECURITY: Chỉ cho phép xem profile của chính mình hoặc admin
    const isOwner = req.user._id.toString() === req.params.id
    const isAdmin = req.user.role === 'admin'

    if (!isOwner && !isAdmin) {
      // Trả về thông tin public cho user khác
      const publicData = {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
      return res.status(200).json({
        success: true,
        data: publicData,
        note: 'Public profile data only'
      })
    }

    // Trả về full info cho chính mình hoặc admin
    res.status(200).json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('❌ Lỗi getUserById:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Cập nhật thông tin user
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res) => {
  try {
    const { fullName, phone, avatar } = req.body

    // Chỉ cho phép user cập nhật thông tin của chính mình hoặc admin
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật thông tin user này'
      })
    }

    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      })
    }

    // Validate phone number format if provided
    if (phone !== undefined && phone !== '' && phone !== null) {
      const phoneRegex = /^[0-9]{10,11}$/
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại không hợp lệ. Vui lòng nhập 10-11 chữ số'
        })
      }
    }

    // Validate avatar URL if provided
    if (avatar !== undefined && avatar !== '' && avatar !== null) {
      try {
        new URL(avatar)
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'URL avatar không hợp lệ'
        })
      }
    }

    // Cập nhật các trường được phép
    if (fullName !== undefined) user.fullName = fullName
    if (phone !== undefined) user.phone = phone
    if (avatar !== undefined) user.avatar = avatar

    await user.save()

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: user
    })
  } catch (error) {
    console.error('❌ Lỗi updateUser:', error)
    
    // Handle validation errors from Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      })
    }
    
    // Handle other specific errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// @desc    Xóa user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      })
    }

    await user.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Xóa user thành công'
    })
  } catch (error) {
    console.error('❌ Lỗi deleteUser:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Khóa/Mở khóa user
// @route   PATCH /api/users/:id/block
// @access  Private/Admin
exports.toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      })
    }

    // Không cho phép khóa chính mình
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Không thể khóa chính mình'
      })
    }

    user.isBlocked = !user.isBlocked
    await user.save()

    res.status(200).json({
      success: true,
      message: user.isBlocked ? 'Đã khóa user' : 'Đã mở khóa user',
      data: user
    })
  } catch (error) {
    console.error('❌ Lỗi toggleBlockUser:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Thay đổi role user
// @route   PATCH /api/users/:id/role
// @access  Private/Admin
exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body

    // Validate role với các giá trị mới
    if (!['admin', 'student', 'lecturer', 'manager'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role không hợp lệ. Các role hợp lệ: admin, student, lecturer, manager'
      })
    }

    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      })
    }

    // Không cho phép thay đổi role của chính mình
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Không thể thay đổi role của chính mình'
      })
    }

    const oldRole = user.role
    user.role = role
    await user.save()

    res.status(200).json({
      success: true,
      message: `Đã thay đổi role thành công sang '${role}'`,
      data: user
    })
  } catch (error) {
    console.error('❌ Lỗi changeUserRole:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}
