const mongoose = require('mongoose')

const teacherSchema = new mongoose.Schema(
  {
    // Reference đến User model
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID là bắt buộc'],
      unique: true
    },
    
    // Chức danh/Học vị (VD: Giảng viên, Tiến sĩ, Phó Giáo sư, etc.)
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Chức danh không được quá 100 ký tự']
    },
    
    // Họ và tên (lấy từ User nhưng có thể override)
    name: {
      type: String,
      required: [true, 'Tên là bắt buộc'],
      trim: true,
      maxlength: [100, 'Tên không được quá 100 ký tự']
    },
    
    // Email (lấy từ User nhưng có thể override)
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
    },
    
    // Chuyên môn/Lĩnh vực (VD: "Lập trình Web, AI, Machine Learning")
    expertise: {
      type: String,
      trim: true,
      maxlength: [500, 'Chuyên môn không được quá 500 ký tự']
    },
    
    // Khoa/Bộ môn
    department: {
      type: String,
      trim: true,
      maxlength: [100, 'Tên khoa không được quá 100 ký tự']
    },
    
    // Cấp độ/Level (VD: "Junior", "Senior", "Expert")
    level: {
      type: String,
      enum: ['Junior', 'Mid-level', 'Senior', 'Expert'],
      default: 'Mid-level'
    },
  },
  {
    timestamps: true // Tự động thêm createdAt và updatedAt
  }
)

// Index để tìm kiếm nhanh
teacherSchema.index({ email: 1 })
teacherSchema.index({ name: 1 })
teacherSchema.index({ department: 1 })
teacherSchema.index({ level: 1 })

// Virtual để populate user info
teacherSchema.virtual('userInfo', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
})

// Đảm bảo virtuals được include khi convert to JSON
teacherSchema.set('toJSON', { virtuals: true })
teacherSchema.set('toObject', { virtuals: true })

// Pre-save middleware để validate user role và auto-fill name/email từ User
teacherSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('user')) {
    const User = mongoose.model('User')
    const user = await User.findById(this.user)
    
    if (!user) {
      return next(new Error('User không tồn tại'))
    }
    
    // Auto-fill name và email từ User nếu chưa có
    if (!this.name) {
      this.name = user.fullName || user.username
    }
    if (!this.email) {
      this.email = user.email
    }
  }
  next()
})

const Teacher = mongoose.model('Teacher', teacherSchema)

module.exports = Teacher
