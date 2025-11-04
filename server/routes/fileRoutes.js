const express = require('express')
const router = express.Router()
const fileController = require('../controllers/fileController')
const { protect } = require('../middlewares/authMiddleware')
const upload = require('../middlewares/uploadMiddleware')

// All routes require authentication
router.use(protect)

// @route   POST /api/files/upload
// @desc    Upload files to Cloudinary
// @access  Private
router.post('/upload', upload.array('files', 10), fileController.uploadFiles)

// @route   DELETE /api/files/:publicId
// @desc    Delete file from Cloudinary
// @access  Private
router.delete('/:publicId', fileController.deleteFile)

module.exports = router
