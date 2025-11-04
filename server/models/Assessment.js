const mongoose = require('mongoose')

const assessmentSchema = new mongoose.Schema(
  {
    // Tên bài đánh giá
    title: {
      type: String,
      required: [true, 'Tên bài đánh giá là bắt buộc'],
      trim: true,
      maxlength: [200, 'Tên bài đánh giá không được quá 200 ký tự']
    },
    
    // Enrollment (liên kết với sinh viên và lớp)
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: [true, 'Enrollment là bắt buộc']
    },
    
    // Điểm số
    score: {
      type: Number,
      min: [0, 'Điểm không thể âm'],
      max: [100, 'Điểm không thể vượt quá 100']
    },
    
    // Phản hồi/Nhận xét
    feedback: {
      type: String,
      trim: true,
      maxlength: [2000, 'Phản hồi không được quá 2000 ký tự']
    },
    
    // Ngày nộp bài
    submissionDate: {
      type: Date
    },
    
    // Ngày chấm điểm
    gradedDate: {
      type: Date
    },
    
    // Loại đánh giá
    type: {
      type: String,
      enum: ['Quiz', 'Assignment', 'Midterm', 'Final', 'Project', 'Presentation'],
      default: 'Assignment'
    },
    
    // Trọng số (%)
    weight: {
      type: Number,
      min: [0, 'Trọng số không thể âm'],
      max: [100, 'Trọng số không thể vượt quá 100'],
      default: 10
    },
    
    // Trạng thái
    status: {
      type: String,
      enum: ['Pending', 'Submitted', 'Graded', 'Late'],
      default: 'Pending'
    },
    
    // File đính kèm (Cloudinary URLs và metadata)
    attachments: [{
      originalName: {
        type: String,
        trim: true
      },
      mimeType: {
        type: String,
        trim: true
      },
      size: {
        type: Number
      },
      url: {
        type: String,
        trim: true
      },
      cloudinaryId: {
        type: String,
        trim: true
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],

    // Deadline cho submission
    deadline: {
      type: Date
    },

    // Để theo dõi xem bài có bị muộn không
    isLate: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

// Indexes
assessmentSchema.index({ enrollment: 1 })
assessmentSchema.index({ type: 1 })
assessmentSchema.index({ status: 1 })
assessmentSchema.index({ submissionDate: 1 })

// Virtual để lấy thông tin user và class từ enrollment
assessmentSchema.virtual('enrollmentInfo', {
  ref: 'Enrollment',
  localField: 'enrollment',
  foreignField: '_id',
  justOne: true
})

assessmentSchema.set('toJSON', { virtuals: true })
assessmentSchema.set('toObject', { virtuals: true })

// Method để submit assessment
assessmentSchema.methods.submit = function() {
  if (this.status !== 'Pending') {
    throw new Error('Assessment đã được submit')
  }

  this.status = 'Submitted'
  this.submissionDate = new Date()

  // Kiểm tra xem bài có bị muộn không
  if (this.deadline && this.submissionDate > this.deadline) {
    this.status = 'Late'
    this.isLate = true
  }

  return this.save()
}

// Method để grade assessment
assessmentSchema.methods.grade = function(score, feedback) {
  if (this.status !== 'Submitted' && this.status !== 'Late') {
    throw new Error('Chỉ có thể chấm điểm assessment đã submit')
  }
  
  if (score < 0 || score > 100) {
    throw new Error('Điểm phải từ 0 đến 100')
  }
  
  this.score = score
  this.feedback = feedback
  this.status = 'Graded'
  this.gradedDate = new Date()
  return this.save()
}

// Static method để tính điểm trung bình của enrollment
assessmentSchema.statics.calculateEnrollmentAverage = async function(enrollmentId) {
  const assessments = await this.find({
    enrollment: enrollmentId,
    status: 'Graded'
  })

  if (assessments.length === 0) {
    return null
  }

  let totalWeightedScore = 0
  let totalWeight = 0

  assessments.forEach(assessment => {
    totalWeightedScore += assessment.score * assessment.weight
    totalWeight += assessment.weight
  })

  return totalWeight > 0 ? totalWeightedScore / totalWeight : 0
}

// Static method để tự động đánh dấu các bài muộn
assessmentSchema.statics.markLateSubmissions = async function() {
  try {
    const now = new Date()

    const result = await this.updateMany(
      {
        deadline: { $lt: now },
        status: 'Pending',
        isLate: false
      },
      {
        $set: {
          status: 'Late',
          isLate: true
        }
      }
    )

    console.log(`✅ Marked ${result.modifiedCount} assessments as late`)
    return result
  } catch (error) {
    console.error('❌ Error marking late submissions:', error)
    throw error
  }
}

// Static method để lấy các bài chưa được chấm điểm cho lớp
assessmentSchema.statics.getUngraded = async function(classId, type = null) {
  const query = {
    status: { $in: ['Submitted', 'Late'] }
  }

  if (type) {
    query.type = type
  }

  // Nếu truyền classId, tìm enrollments trong lớp đó
  if (classId) {
    const Enrollment = mongoose.model('Enrollment')
    const enrollments = await Enrollment.find({ class: classId }).select('_id')
    query.enrollment = { $in: enrollments.map(e => e._id) }
  }

  return this.find(query)
    .populate({
      path: 'enrollment',
      populate: 'user'
    })
    .sort({ submissionDate: 1 })
}

const Assessment = mongoose.model('Assessment', assessmentSchema)

module.exports = Assessment
