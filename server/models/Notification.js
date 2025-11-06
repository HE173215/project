const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    // Người nhận
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User là bắt buộc']
    },
    
    // Tiêu đề
    title: {
      type: String,
      required: [true, 'Tiêu đề là bắt buộc'],
      trim: true,
      maxlength: [200, 'Tiêu đề không được quá 200 ký tự']
    },
    
    // Nội dung thông báo
    message: {
      type: String,
      required: [true, 'Nội dung là bắt buộc'],
      trim: true,
      maxlength: [1000, 'Nội dung không được quá 1000 ký tự']
    },
    
    // Loại thông báo
    type: {
      type: String,
      enum: ['Info', 'Success', 'Warning', 'Error', 'Announcement'],
      default: 'Info'
    },
    
    // Liên kết (nếu có)
    link: {
      type: String,
      trim: true
    },
    
    // Đã đọc chưa
    isRead: {
      type: Boolean,
      default: false
    },
    
    // Ngày đọc
    readAt: {
      type: Date
    },
    
    // Reference đến object liên quan (optional)
    relatedModel: {
      type: String,
      enum: ['Class', 'Course', 'Enrollment', 'Assessment', 'Schedule', 'AIAssignment', null]
    },
    
    relatedId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  {
    timestamps: true
  }
)

// Indexes
notificationSchema.index({ user: 1 })
notificationSchema.index({ isRead: 1 })
notificationSchema.index({ type: 1 })
notificationSchema.index({ createdAt: -1 })
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 })

// Method để đánh dấu đã đọc
notificationSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true
    this.readAt = new Date()
    return this.save()
  }
  return this
}

// Method để đánh dấu chưa đọc
notificationSchema.methods.markAsUnread = function() {
  if (this.isRead) {
    this.isRead = false
    this.readAt = null
    return this.save()
  }
  return this
}

// Static method để tạo notification cho nhiều users
notificationSchema.statics.createForUsers = async function(userIds, notificationData) {
  const notifications = userIds.map(userId => ({
    user: userId,
    ...notificationData
  }))
  
  return this.insertMany(notifications)
}

// Static method để đánh dấu tất cả notifications của user là đã đọc
notificationSchema.statics.markAllAsReadForUser = async function(userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  )
}

// Static method để xóa notifications cũ
notificationSchema.statics.deleteOldNotifications = async function(daysOld = 30) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true
  })
}

// Static method để đếm số notifications chưa đọc
notificationSchema.statics.countUnreadForUser = async function(userId) {
  return this.countDocuments({
    user: userId,
    isRead: false
  })
}

const Notification = mongoose.model('Notification', notificationSchema)

module.exports = Notification
