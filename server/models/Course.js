const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    // Tên khóa học
    title: {
      type: String,
      required: [true, 'Tên khóa học là bắt buộc'],
      trim: true,
      maxlength: [200, 'Tên khóa học không được quá 200 ký tự']
    },

    // Mã khóa học
    name: {
      type: String,
      required: [true, 'Mã khóa học là bắt buộc'],
      trim: true,
      unique: true,
      uppercase: true,
      maxlength: [20, 'Mã khóa học không được quá 20 ký tự']
    },

    // Chuyên môn
    expertise: {
      type: String,
      trim: true,
      maxlength: [500, 'Chuyên môn không được quá 500 ký tự']
    },

    // Mô tả
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Mô tả không được quá 2000 ký tự']
    },

    // Thời lượng (số giờ)
    duration: {
      type: Number,
      min: [1, 'Thời lượng phải ít nhất 1 giờ']
    },

    // Cấp độ
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Beginner'
    },

    // Danh sách managers (User._id)
    managers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      ],
      default: []
    },

    // Trạng thái
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Inactive', 'Archived'],
      default: 'Draft'
    }
  },
  {
    timestamps: true
  }
);

// Index
courseSchema.index({ title: 1 });
courseSchema.index({ managers: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ status: 1 });

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;
