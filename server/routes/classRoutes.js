const express = require('express')
const router = express.Router()
const classController = require('../controllers/classController')
const { protect, authorize } = require('../middlewares/authMiddleware')

// Public
router.get('/:id', classController.getClassById)
router.patch('/:id/teaching-days', protect, authorize('lecturer'), classController.updateTeachingDaysForClass);

// Admin
router.get('/', protect, classController.getAllClasses);
router.post('/', protect, authorize('admin'), classController.createClass)
router.put('/:id', protect, authorize('admin'), classController.updateClass)
router.delete('/:id', protect, authorize('admin'), classController.deleteClass)

module.exports = router
