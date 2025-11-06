const multer = require('multer')
const path = require('path')

// Configure multer to store files in memory (we'll send to Cloudinary)
const storage = multer.memoryStorage()

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ]

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`File type not allowed. Allowed types: PDF, Word, Excel, Images, Text, ZIP`), false)
  }
}

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter
})

module.exports = upload
