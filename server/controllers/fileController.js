const cloudinary = require('../config/cloudinaryConfig')
const streamifier = require('streamifier')

// @desc    Upload files to Cloudinary
// @route   POST /api/files/upload
// @access  Private
exports.uploadFiles = async (req, res) => {
  try {
    // Check if files exist
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided'
      })
    }

    const uploadedFiles = []
    const errors = []

    // Upload each file to Cloudinary
    for (const file of req.files) {
      try {
        // Normalize filename for Cloudinary public_id (remove special characters)
        const normalizedName = file.originalname
          .replace(/\.[^/.]+$/, '') // Remove extension
          .replace(/[^a-zA-Z0-9-_]/g, '_') // Replace special chars with underscore
          .substring(0, 50); // Limit length

        // Upload file to Cloudinary using promise-based approach
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'auto',
              folder: 'assessments',
              public_id: `${Date.now()}_${normalizedName}`,
              overwrite: false
            },
            (error, result) => {
              if (error) {
                reject(new Error(`Failed to upload ${file.originalname}: ${error.message}`))
              } else {
                resolve(result)
              }
            }
          )

          // Pipe file buffer to stream
          streamifier.createReadStream(file.buffer).pipe(stream)
        })

        const uploadedFile = {
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: result.secure_url,
          cloudinaryId: result.public_id,
          uploadedAt: new Date()
        }
        console.log(`✅ File uploaded: ${file.originalname} -> originalName: ${uploadedFile.originalName}`)
        uploadedFiles.push(uploadedFile)
      } catch (error) {
        errors.push({
          file: file.originalname,
          error: error.message
        })
      }
    }

    // Check if any files were uploaded successfully
    if (uploadedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All files failed to upload',
        errors
      })
    }

    res.status(200).json({
      success: true,
      message: `Uploaded ${uploadedFiles.length} file(s) successfully`,
      data: {
        uploadedCount: uploadedFiles.length,
        failedCount: errors.length,
        files: uploadedFiles,
        errors: errors.length > 0 ? errors : undefined
      }
    })
  } catch (error) {
    console.error('❌ Lỗi uploadFiles:', error)
    res.status(500).json({
      success: false,
      message: 'Error uploading files',
      error: error.message
    })
  }
}

// @desc    Delete file from Cloudinary
// @route   DELETE /api/files/:publicId
// @access  Private
exports.deleteFile = async (req, res) => {
  try {
    const { publicId } = req.params

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      })
    }

    const result = await cloudinary.uploader.destroy(publicId)

    if (result.result === 'ok') {
      res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      })
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to delete file'
      })
    }
  } catch (error) {
    console.error('❌ Lỗi deleteFile:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    })
  }
}
