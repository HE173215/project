const express = require('express')
const router = express.Router()
const notificationController = require('../controllers/notificationController')
const { protect, authorize } = require('../middlewares/authMiddleware')

// All routes require authentication
router.use(protect)

// All authenticated users
router.get('/my-notifications', notificationController.getMyNotifications)
router.get('/unread-count', notificationController.getUnreadCount)
router.patch('/mark-all-read', notificationController.markAllAsRead)
router.delete('/delete-read', notificationController.deleteReadNotifications)

// Admin, Manager only
router.post('/', authorize('admin', 'manager'), notificationController.createNotification)
router.post('/bulk', authorize('admin', 'manager'), notificationController.createBulkNotifications)

// Admin only
router.get('/', authorize('admin'), notificationController.getAllNotifications)
router.delete('/cleanup', authorize('admin'), notificationController.cleanupOldNotifications)

// Mixed permissions (checked in controller)
router.patch('/:id/read', notificationController.markAsRead) // Owner or Admin
router.delete('/:id', notificationController.deleteNotification) // Owner or Admin

module.exports = router
