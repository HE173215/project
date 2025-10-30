const express = require('express')
const router = express.Router()
const roomController = require('../controllers/roomController')
const { protect, authorize } = require('../middlewares/authMiddleware')

// Public routes
router.get('/', roomController.getAllRooms)
router.get('/:id', roomController.getRoomById)

// Protected routes - Admin or Manager only
router.post('/', protect, authorize('admin', 'manager'), roomController.createRoom)
router.put('/:id', protect, authorize('admin', 'manager'), roomController.updateRoom)
router.delete('/:id', protect, authorize('admin', 'manager'), roomController.deleteRoom)

module.exports = router
