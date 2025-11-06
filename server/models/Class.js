const mongoose = require('mongoose')

const classSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tên lớp học là bắt buộc'],
      trim: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    maxStudents: {
      type: Number,
      required: true,
      min: [1, 'Số lượng tối thiểu phải lớn hơn 0']
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Cancelled'],
      default: 'Active'
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    },
    teachingDays: [
      {
        type: String,
        enum: [
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday'
        ]
      }
    ],
    currentStudents: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
)

// Kiểm tra còn slot
classSchema.methods.hasAvailableSlots = function () {
  return this.currentStudents < this.maxStudents
}

const Class = mongoose.model('Class', classSchema)
module.exports = Class
