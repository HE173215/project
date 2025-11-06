const express = require('express')
const router = express.Router()
const assessmentController = require('../controllers/assessmentController')
const { protect, authorize } = require('../middlewares/authMiddleware')

// All routes require authentication
router.use(protect)

// ===== STUDENT ROUTES =====
router.get('/my-assessments', assessmentController.getMyAssessments)
router.get('/my-pending', assessmentController.getMyPendingAssessments)
router.patch('/:id/submit', assessmentController.submitAssessment)

// ===== TEACHER/ADMIN/MANAGER ROUTES =====
// Create assessment (for single student)
router.post('/', authorize('admin', 'manager', 'lecturer'), assessmentController.createAssessment)

// Create assessment for entire class
router.post('/create-for-class', authorize('admin', 'manager', 'lecturer'), assessmentController.createAssessmentForClass)

// Get all assessments with filters
router.get('/', authorize('admin', 'manager', 'lecturer'), assessmentController.getAllAssessments)

// Grade single assessment
router.patch('/:id/grade', authorize('admin', 'manager', 'lecturer'), assessmentController.gradeAssessment)

// Bulk grade assessments
router.post('/bulk-grade', authorize('admin', 'manager', 'lecturer'), assessmentController.bulkGradeAssessments)

// Get ungraded assessments for a class
router.get('/ungraded/class/:classId', authorize('admin', 'manager', 'lecturer'), assessmentController.getUngradedForClass)

// Update assessment
router.put('/:id', authorize('admin', 'manager', 'lecturer'), assessmentController.updateAssessment)

// ===== ADMIN/MANAGER/LECTURER ROUTES =====
// Delete assessment
router.delete('/:id', authorize('admin', 'manager', 'lecturer'), assessmentController.deleteAssessment)

// Mark late submissions
router.post('/mark-late', authorize('admin', 'manager'), assessmentController.markLateSubmissions)

// ===== MIXED PERMISSIONS (checked in controller) =====
// Get assessment by ID - Owner, Admin, Manager, Lecturer
router.get('/:id', assessmentController.getAssessmentById)

// Get enrollment average
router.get('/enrollment/:enrollmentId/average', assessmentController.getEnrollmentAverage)

module.exports = router
