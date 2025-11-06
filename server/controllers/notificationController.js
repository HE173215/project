const Notification = require('../models/Notification')

// @desc    Tạo notification mới
// @route   POST /api/notifications
// @access  Private (Admin, Manager)
exports.createNotification = async (req, res) => {
  try {
    const { user, title, message, type, link, relatedModel, relatedId } = req.body

    // Validate required fields
    if (!user || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'User, title và message là bắt buộc'
      })
    }

    const notification = await Notification.create({
      user,
      title,
      message,
      type,
      link,
      relatedModel,
      relatedId
    })

    await notification.populate('user', 'username email fullName')

    res.status(201).json({
      success: true,
      message: 'Tạo notification thành công',
      data: notification
    })
  } catch (error) {
    console.error('❌ Lỗi createNotification:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Tạo notification cho nhiều users
// @route   POST /api/notifications/bulk
// @access  Private (Admin, Manager)
exports.createBulkNotifications = async (req, res) => {
  try {
    const { userIds, title, message, type, link, relatedModel, relatedId } = req.body

    // Validate required fields
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'UserIds phải là array và không được rỗng'
      })
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title và message là bắt buộc'
      })
    }

    const notifications = await Notification.createForUsers(userIds, {
      title,
      message,
      type,
      link,
      relatedModel,
      relatedId
    })

    res.status(201).json({
      success: true,
      message: `Đã tạo ${notifications.length} notifications`,
      count: notifications.length
    })
  } catch (error) {
    console.error('❌ Lỗi createBulkNotifications:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Lấy tất cả notifications
// @route   GET /api/notifications
// @access  Private (Admin)
exports.getAllNotifications = async (req, res) => {
  try {
    const { user, type, isRead, page = 1, limit = 10 } = req.query

    const query = {}

    if (user) {
      query.user = user
    }

    if (type) {
      query.type = type
    }

    if (isRead !== undefined) {
      query.isRead = isRead === 'true'
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const notifications = await Notification.find(query)
      .populate('user', 'username email fullName')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 })

    const total = await Notification.countDocuments(query)

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: notifications
    })
  } catch (error) {
    console.error('❌ Lỗi getAllNotifications:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Lấy notifications của user hiện tại
// @route   GET /api/notifications/my-notifications
// @access  Private
exports.getMyNotifications = async (req, res) => {
  try {
    const { isRead, page = 1, limit = 20 } = req.query

    const query = { user: req.user._id }

    if (isRead !== undefined) {
      query.isRead = isRead === 'true'
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const notifications = await Notification.find(query)
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 })

    const total = await Notification.countDocuments(query)
    const unreadCount = await Notification.countUnreadForUser(req.user._id)

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: notifications
    })
  } catch (error) {
    console.error('❌ Lỗi getMyNotifications:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Lấy số lượng notifications chưa đọc
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countUnreadForUser(req.user._id)

    res.status(200).json({
      success: true,
      data: {
        unreadCount: count
      }
    })
  } catch (error) {
    console.error('❌ Lỗi getUnreadCount:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Đánh dấu notification là đã đọc
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy notification'
      })
    }

    // Kiểm tra quyền: chỉ owner hoặc admin mới mark được
    if (
      req.user.role !== 'admin' &&
      req.user._id.toString() !== notification.user.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền'
      })
    }

    await notification.markAsRead()

    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu đã đọc',
      data: notification
    })
  } catch (error) {
    console.error('❌ Lỗi markAsRead:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Đánh dấu tất cả notifications là đã đọc
// @route   PATCH /api/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.markAllAsReadForUser(req.user._id)

    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu tất cả là đã đọc',
      modifiedCount: result.modifiedCount
    })
  } catch (error) {
    console.error('❌ Lỗi markAllAsRead:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Xóa notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy notification'
      })
    }

    // Kiểm tra quyền: chỉ owner hoặc admin mới xóa được
    if (
      req.user.role !== 'admin' &&
      req.user._id.toString() !== notification.user.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền'
      })
    }

    await notification.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Xóa notification thành công'
    })
  } catch (error) {
    console.error('❌ Lỗi deleteNotification:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Xóa tất cả notifications đã đọc của user
// @route   DELETE /api/notifications/delete-read
// @access  Private
exports.deleteReadNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      user: req.user._id,
      isRead: true
    })

    res.status(200).json({
      success: true,
      message: 'Đã xóa tất cả notifications đã đọc',
      deletedCount: result.deletedCount
    })
  } catch (error) {
    console.error('❌ Lỗi deleteReadNotifications:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Xóa notifications cũ (Admin)
// @route   DELETE /api/notifications/cleanup
// @access  Private (Admin)
exports.cleanupOldNotifications = async (req, res) => {
  try {
    const { daysOld = 30 } = req.query

    const result = await Notification.deleteOldNotifications(parseInt(daysOld))

    res.status(200).json({
      success: true,
      message: `Đã xóa notifications cũ hơn ${daysOld} ngày`,
      deletedCount: result.deletedCount
    })
  } catch (error) {
    console.error('❌ Lỗi cleanupOldNotifications:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}
