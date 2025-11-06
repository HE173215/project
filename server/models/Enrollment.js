const mongoose = require('mongoose')

const enrollmentSchema = new mongoose.Schema(
  {
    // Sinh viên
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User là bắt buộc']
    },

    // Khóa học (student đăng ký theo khóa học, chưa gán lớp ngay)
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Khóa học là bắt buộc']
    },

    // Lớp học (chỉ có sau khi được Admin/Manager phê duyệt)
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    },

    // Trạng thái đăng ký
    status: {
      type: String,
      enum: ['PendingApproval', 'Approved', 'DropRequested', 'Rejected', 'Completed', 'Dropped'],
      default: 'PendingApproval'
    },

    // Ngày đăng ký
    registrationDate: {
      type: Date,
      default: Date.now
    },

    // Ngày phê duyệt
    approvalDate: {
      type: Date
    },

    // Ngày gửi yêu cầu hủy
    dropRequestDate: {
      type: Date
    },

    // Điểm số
    grade: {
      type: Number,
      min: [0, 'Điểm không thể âm'],
      max: [100, 'Điểm không thể vượt quá 100']
    },

    // Tỷ lệ tham gia (%)
    attendanceRate: {
      type: Number,
      min: [0, 'Tỷ lệ tham gia không thể âm'],
      max: [100, 'Tỷ lệ tham gia không thể vượt quá 100'],
      default: 0
    },

    // Ghi chú
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Ghi chú không được quá 1000 ký tự']
    }
  },
  {
    timestamps: true
  }
)

//
// 🔹 Indexes
//
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true })
enrollmentSchema.index({ course: 1 })
enrollmentSchema.index({ class: 1 })
enrollmentSchema.index({ status: 1 })
enrollmentSchema.index({ registrationDate: 1 })

//
// 🔹 Validate role student
//
enrollmentSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('user')) {
    const User = mongoose.model('User')
    const user = await User.findById(this.user)
    if (!user) return next(new Error('User không tồn tại'))
    if (user.role !== 'student')
      return next(new Error('Chỉ student mới có thể đăng ký khóa học'))
  }
  next()
})

//
// 🔹 Tự động cập nhật số lượng sinh viên khi trạng thái đổi
//
enrollmentSchema.post('save', async function (doc) {
  if (doc.class && (doc.status === 'Approved' || doc.status === 'Dropped')) {
    const Class = mongoose.model('Class')
    const classDoc = await Class.findById(doc.class)
    if (classDoc) {
      const approvedCount = await mongoose
        .model('Enrollment')
        .countDocuments({ class: doc.class, status: 'Approved' })
      classDoc.currentStudents = approvedCount
      await classDoc.save()
    }
  }
})

//
// 🔹 Methods
//

// Phê duyệt enrollment
enrollmentSchema.methods.approve = async function (classId) {
  if (this.status !== 'PendingApproval') {
    throw new Error('Chỉ có thể approve enrollment ở trạng thái PendingApproval')
  }

  const Class = mongoose.model('Class')
  const classDoc = await Class.findById(classId)
  if (!classDoc) throw new Error('Lớp học không tồn tại')
  if (!classDoc.hasAvailableSlots()) throw new Error('Lớp học đã đầy')

  this.class = classId
  this.status = 'Approved'
  this.approvalDate = new Date()

  classDoc.currentStudents += 1
  await classDoc.save()

  return this.save()
}

// Từ chối enrollment
enrollmentSchema.methods.reject = async function () {
  if (this.status !== 'PendingApproval') {
    throw new Error('Chỉ có thể reject enrollment ở trạng thái PendingApproval')
  }
  this.status = 'Rejected'
  return this.save()
}

// Student hủy lớp sau khi được approve
enrollmentSchema.methods.drop = async function () {
  if (!['Approved', 'DropRequested'].includes(this.status)) {
    throw new Error('Chỉ có thể drop enrollment đã được phê duyệt hoặc đang chờ hủy')
  }
  this.status = 'Dropped'
  this.dropRequestDate = null
  await this.save()

  if (this.class) {
    const Class = mongoose.model('Class')
    const classDoc = await Class.findById(this.class)
    if (classDoc) {
      classDoc.currentStudents = Math.max(0, classDoc.currentStudents - 1)
      await classDoc.save()
    }
  }
  return this
}

const Enrollment = mongoose.model('Enrollment', enrollmentSchema)
module.exports = Enrollment
