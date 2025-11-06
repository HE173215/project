const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// ✅ Cho phép student xem danh sách & chi tiết
router.get('/', protect, courseController.getAllCourses);
router.get('/:id', protect, courseController.getCourseById);

// ✅ Admin toàn quyền, manager chỉ được sửa
router.post('/', protect, authorize('admin'), courseController.createCourse);
router.put('/:id', protect, authorize('admin', 'manager'), courseController.updateCourse);
router.delete('/:id', protect, authorize('admin'), courseController.deleteCourse);

module.exports = router;
