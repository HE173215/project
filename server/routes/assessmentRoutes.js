const express = require('express')
const router = express.Router()
const assessmentController = require('../controllers/assessmentController')
const { protect, authorize } = require('../middlewares/authMiddleware')

// All routes require authentication
router.use(protect)

// Student routes
router.get('/my-assessments', assessmentController.getMyAssessments)
router.patch('/:id/submit', assessmentController.submitAssessment)

// Admin, Manager, Lecturer routes
router.post('/', authorize('admin', 'manager', 'lecturer'), assessmentController.createAssessment)
router.get('/', authorize('admin', 'manager', 'lecturer'), assessmentController.getAllAssessments)
router.put('/:id', authorize('admin', 'manager', 'lecturer'), assessmentController.updateAssessment)
router.patch('/:id/grade', authorize('admin', 'manager', 'lecturer'), assessmentController.gradeAssessment)

// Admin, Manager only
router.delete('/:id', authorize('admin', 'manager'), assessmentController.deleteAssessment)

// Mixed permissions (checked in controller)
router.get('/:id', assessmentController.getAssessmentById) // Owner, Admin, Manager, Lecturer
router.get('/enrollment/:enrollmentId/average', assessmentController.getEnrollmentAverage)

module.exports = router
