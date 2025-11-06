const express = require('express')
const router = express.Router()
const teacherController = require('../controllers/teacherController')
const { protect, authorize } = require('../middlewares/authMiddleware')

// Public routes
router.get('/', teacherController.getAllTeachers)
router.get('/:id', teacherController.getTeacherById)
router.get('/user/:userId', teacherController.getTeacherByUserId)

// Protected routes
router.post('/', protect, authorize('lecturer', 'admin', 'manager'), teacherController.createTeacher)
router.put('/:id', protect, authorize('lecturer', 'admin'), teacherController.updateTeacher)
router.patch('/me/teaching-days', protect, authorize('lecturer'), teacherController.updateTeachingDays)
router.delete('/:id', protect, authorize('admin'), teacherController.deleteTeacher)

module.exports = router
