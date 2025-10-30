const express = require('express')
const router = express.Router()
const scheduleController = require('../controllers/scheduleController')
const { protect, authorize } = require('../middlewares/authMiddleware')

// ✅ Tất cả route đọc dữ liệu cũng phải qua protect
router.get('/', protect, scheduleController.getAllSchedules)
router.get('/:id', protect, scheduleController.getScheduleById)
router.get('/class/:classId', protect, scheduleController.getSchedulesByClass)

// ✅ Chỉ admin/manager mới được tạo, sửa, xóa
router.post('/', protect, authorize('admin', 'manager'), scheduleController.createSchedule)
router.put('/:id', protect, authorize('admin', 'manager'), scheduleController.updateSchedule)
router.delete('/:id', protect, authorize('admin', 'manager'), scheduleController.deleteSchedule)

module.exports = router
