const mongoose = require('mongoose')

const scheduleSchema = new mongoose.Schema(
  {
    // Lớp học
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Lớp học là bắt buộc']
    },

    // Giảng viên phụ trách buổi học
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Giảng viên là bắt buộc']
    },

    // Ngày học
    date: {
      type: Date,
      required: [true, 'Ngày học là bắt buộc']
    },

    // Giờ bắt đầu
    startTime: {
      type: String,
      required: [true, 'Giờ bắt đầu là bắt buộc'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Giờ bắt đầu không hợp lệ (HH:MM)']
    },

    // Giờ kết thúc
    endTime: {
      type: String,
      required: [true, 'Giờ kết thúc là bắt buộc'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Giờ kết thúc không hợp lệ (HH:MM)']
    },

    // Phòng học
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Phòng học là bắt buộc']
    },

    // Chủ đề/Nội dung buổi học
    topic: {
      type: String,
      trim: true,
      maxlength: [200, 'Chủ đề không được quá 200 ký tự']
    },

    // Ghi chú
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Ghi chú không được quá 1000 ký tự']
    },

    // Trạng thái
    status: {
      type: String,
      enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Scheduled'
    }
  },
  { timestamps: true }
)

// Validation: endTime phải sau startTime
scheduleSchema.pre('save', function (next) {
  const [sh, sm] = this.startTime.split(':').map(Number)
  const [eh, em] = this.endTime.split(':').map(Number)
  const start = sh * 60 + sm
  const end = eh * 60 + em
  if (end <= start) return next(new Error('Giờ kết thúc phải sau giờ bắt đầu'))
  next()
})

// Indexes
scheduleSchema.index({ class: 1 })
scheduleSchema.index({ teacher: 1, date: 1, startTime: 1, endTime: 1 })
scheduleSchema.index({ room: 1 })
scheduleSchema.index({ date: 1 })
scheduleSchema.index({ status: 1 })
scheduleSchema.index({ date: 1, startTime: 1, endTime: 1 })
scheduleSchema.index({ room: 1, date: 1, startTime: 1, endTime: 1 })

// Helper
const toMinutes = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// Static: kiểm tra xung đột lịch phòng
scheduleSchema.statics.checkRoomConflict = async function (
  roomId,
  date,
  startTime,
  endTime,
  excludeScheduleId = null
) {
  const sameDay = await this.find({
    room: roomId,
    date,
    status: { $ne: 'Cancelled' },
    ...(excludeScheduleId ? { _id: { $ne: excludeScheduleId } } : {})
  })

  const start = toMinutes(startTime)
  const end = toMinutes(endTime)

  for (const s of sameDay) {
    const sStart = toMinutes(s.startTime)
    const sEnd = toMinutes(s.endTime)
    if (Math.max(start, sStart) < Math.min(end, sEnd)) return true
  }
  return false
}

// Static: kiểm tra xung đột lịch giáo viên
scheduleSchema.statics.checkTeacherConflict = async function (
  teacherId,
  date,
  startTime,
  endTime,
  excludeScheduleId = null
) {
  const sameDay = await this.find({
    teacher: teacherId,
    date,
    status: { $ne: 'Cancelled' },
    ...(excludeScheduleId ? { _id: { $ne: excludeScheduleId } } : {})
  })

  const start = toMinutes(startTime)
  const end = toMinutes(endTime)

  for (const s of sameDay) {
    const sStart = toMinutes(s.startTime)
    const sEnd = toMinutes(s.endTime)
    if (Math.max(start, sStart) < Math.min(end, sEnd)) return true
  }
  return false
}

module.exports = mongoose.model('Schedule', scheduleSchema)
