const mongoose = require('mongoose')

const roomSchema = new mongoose.Schema(
  {
    // Tên phòng
    name: {
      type: String,
      required: [true, 'Tên phòng là bắt buộc'],
      trim: true,
      unique: true,
      maxlength: [50, 'Tên phòng không được quá 50 ký tự']
    },
    
    // Sức chứa
    capacity: {
      type: Number,
      required: [true, 'Sức chứa là bắt buộc'],
      min: [1, 'Sức chứa phải ít nhất 1 người']
    },
    
    // Loại phòng
    type: {
      type: String,
      enum: ['Classroom', 'Lab', 'Lecture Hall', 'Meeting Room', 'Online'],
      default: 'Classroom'
    },
    
    // Tòa nhà
    building: {
      type: String,
      trim: true
    },
    
    // Tầng
    floor: {
      type: Number
    },
    
    // Thiết bị
    equipment: [{
      type: String,
      trim: true
    }],
    
    // Trạng thái
    status: {
      type: String,
      enum: ['Available', 'Maintenance', 'Unavailable'],
      default: 'Available'
    }
  },
  {
    timestamps: true
  }
)

// Indexes
roomSchema.index({ capacity: 1 })
roomSchema.index({ status: 1 })

const Room = mongoose.model('Room', roomSchema)

module.exports = Room
