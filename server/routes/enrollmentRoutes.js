const express = require('express')
const router = express.Router()
const enrollmentController = require('../controllers/enrollmentController')
const { protect, authorize } = require('../middlewares/authMiddleware')

// 🔒 Tất cả yêu cầu phải đăng nhập
router.use(protect)

// STUDENT routes
router.post('/course-request', authorize('student'), enrollmentController.createCourseEnrollmentRequest)
router.get('/my-enrollments', authorize('student'), enrollmentController.getMyEnrollments)
router.patch('/:id/drop', authorize('student'), enrollmentController.dropEnrollment)

// ADMIN / MANAGER routes
router.patch('/:id/approve', authorize('admin', 'manager'), enrollmentController.approveEnrollment)
router.patch('/:id/reject', authorize('admin', 'manager'), enrollmentController.rejectEnrollment)
router.patch('/:id/drop/approve', authorize('admin', 'manager'), enrollmentController.approveDropEnrollment)
router.patch('/:id/drop/reject', authorize('admin', 'manager'), enrollmentController.rejectDropEnrollment)
router.get('/', authorize('admin','manager'), enrollmentController.getAllEnrollments)
router.patch('/:id/reassign', authorize('admin', 'manager'), enrollmentController.reassignEnrollment)
router.patch('/:id/auto-assign', authorize('admin', 'manager'), enrollmentController.assignClassAutomatically)

module.exports = router
