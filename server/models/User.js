const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    // Thông tin cơ bản
    username: {
      type: String,
      required: [true, 'Username là bắt buộc'],
      unique: true,
      trim: true,
      minlength: [3, 'Username phải có ít nhất 3 ký tự'],
      maxlength: [30, 'Username không được quá 30 ký tự']
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
    },
    password: {
      type: String,
      required: [true, 'Password là bắt buộc'],
      minlength: [6, 'Password phải có ít nhất 6 ký tự']
    },
    
    // Thông tin cá nhân
    fullName: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ']
    },
    avatar: {
      type: String,
      default: null
    },
    
    // Google OAuth
    googleId: {
      type: String,
      unique: true,
      sparse: true // Cho phép null và không bắt buộc unique với null
    },
    
    // Xác thực tài khoản
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: {
      type: String,
      default: null
    },
    
    // OTP cho xác thực
    otp: {
      code: {
        type: String,
        default: null
      },
      expiresAt: {
        type: Date,
        default: null
      },
      attempts: {
        type: Number,
        default: 0
      }
    },
    
    // Reset password
    resetPasswordToken: {
      type: String,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      default: null
    },
    
    // Trạng thái tài khoản
    isActive: {
      type: Boolean,
      default: true
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    
    // Vai trò
    role: {
      type: String,
      enum: ['admin', 'student', 'lecturer', 'manager'],
      default: 'student'
    },
    
    // Thời gian đăng nhập
    lastLogin: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true // Tự động thêm createdAt và updatedAt
  }
)

// Hash password trước khi lưu
userSchema.pre('save', async function (next) {
  // Chỉ hash password nếu nó được thay đổi
  if (!this.isModified('password')) {
    return next()
  }
  
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Tự động tạo Teacher profile khi user có role lecturer
userSchema.post('save', async function (doc) {
  // Chỉ tạo Teacher profile nếu role là lecturer
  if (doc.role === 'lecturer') {
    try {
      // Import Teacher model (lazy import để tránh circular dependency)
      const Teacher = require('./Teacher')
      
      // Kiểm tra xem đã có Teacher profile chưa
      const existingTeacher = await Teacher.findOne({ user: doc._id })
      
      if (!existingTeacher) {
        // Tạo Teacher profile tự động
        await Teacher.create({
          user: doc._id,
          name: doc.fullName || doc.username,
          email: doc.email,
          title: 'Giảng viên', // Default title
          expertise: '', // Để trống, admin/manager sẽ cập nhật sau
          level: 'Mid-level' // Default level
        })
        
        console.log(`✅ Tự động tạo Teacher profile cho user: ${doc.username}`)
      }
    } catch (error) {
      // Log error nhưng không throw để không ảnh hưởng đến việc tạo user
      console.error('❌ Lỗi khi tự động tạo Teacher profile:', error.message)
    }
  }
})

// Tự động tạo Teacher profile khi update role thành lecturer
userSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) {
    try {
      const Teacher = require('./Teacher')
      
      if (doc.role === 'lecturer') {
        // Tạo Teacher profile nếu chưa có
        const existingTeacher = await Teacher.findOne({ user: doc._id })
        
        if (!existingTeacher) {
          await Teacher.create({
            user: doc._id,
            name: doc.fullName || doc.username,
            email: doc.email,
            title: 'Giảng viên',
            expertise: '',
            level: 'Mid-level'
          })
          
          console.log(`✅ Tự động tạo Teacher profile khi update role cho user: ${doc.username}`)
        }
      } else {
        // Nếu role không phải lecturer, xóa Teacher profile nếu có
        const existingTeacher = await Teacher.findOne({ user: doc._id })
        
        if (existingTeacher) {
          await Teacher.findOneAndDelete({ user: doc._id })
          console.log(`✅ Tự động xóa Teacher profile khi thay đổi role cho user: ${doc.username}`)
        }
      }
    } catch (error) {
      console.error('❌ Lỗi khi tự động xử lý Teacher profile (update):', error.message)
    }
  }
})

// So sánh password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw new Error('Lỗi khi so sánh password')
  }
}

// Tạo OTP
userSchema.methods.generateOTP = function () {
  // Tạo mã OTP 6 số
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  
  this.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Hết hạn sau 10 phút
    attempts: 0
  }
  
  return otp
}

// Xác thực OTP
userSchema.methods.verifyOTP = function (inputOTP) {
  // Kiểm tra OTP có tồn tại không
  if (!this.otp.code) {
    return { success: false, message: 'Không có OTP nào được tạo' }
  }
  
  // Kiểm tra OTP đã hết hạn chưa
  if (new Date() > this.otp.expiresAt) {
    return { success: false, message: 'OTP đã hết hạn' }
  }
  
  // Kiểm tra số lần thử
  if (this.otp.attempts >= 5) {
    return { success: false, message: 'Đã vượt quá số lần thử. Vui lòng tạo OTP mới' }
  }
  
  // Tăng số lần thử
  this.otp.attempts += 1
  
  // So sánh OTP
  if (this.otp.code === inputOTP) {
    // Xóa OTP sau khi xác thực thành công
    this.otp = {
      code: null,
      expiresAt: null,
      attempts: 0
    }
    this.isVerified = true
    return { success: true, message: 'Xác thực OTP thành công' }
  }
  
  return { success: false, message: 'OTP không chính xác' }
}

// Xóa OTP
userSchema.methods.clearOTP = function () {
  this.otp = {
    code: null,
    expiresAt: null,
    attempts: 0
  }
}

// Loại bỏ password khi trả về JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject()
  delete user.password
  delete user.otp
  delete user.verificationToken
  delete user.resetPasswordToken
  delete user.resetPasswordExpires
  return user
}

const User = mongoose.model('User', userSchema)

module.exports = User
