/**
 * File Upload Service
 * Handles file uploads to Cloudinary via backend API
 */

import api from '../utils/axiosInstance'

class FileService {
  constructor() {
    this.uploadedFiles = new Map()
  }

  /**
   * Upload files to Cloudinary via backend API
   * @param {File[]} files - Array of files to upload
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object[]>} - Array of file objects with metadata
   */
  async uploadFiles(files, onProgress = null) {
    try {
      // Create FormData with all files
      const formData = new FormData()

      // Append each file with validation
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate file before upload
        const validation = this.validateFile(file)
        if (!validation.valid) {
          throw new Error(`${file.name}: ${validation.error}`)
        }

        formData.append('files', file)
      }

      // Upload all files to backend
      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            onProgress(percentCompleted, files.length, files.length)
          }
        }
      })

      if (!response.data.success) {
        throw new Error(response.data.message || 'Upload failed')
      }

      // Extract uploaded files from response
      if (response.data.data && response.data.data.files) {
        return response.data.data.files
      }

      return []
    } catch (error) {
      console.error('❌ File upload error:', error)
      throw new Error(error.response?.data?.message || error.message || 'Failed to upload files')
    }
  }

  /**
   * Delete file from Cloudinary via backend API
   * @param {string} cloudinaryId - Cloudinary public ID
   * @returns {Promise<void>}
   */
  async deleteFile(cloudinaryId) {
    try {
      if (!cloudinaryId) {
        throw new Error('Cloudinary ID is required')
      }

      const response = await api.delete(`/files/${cloudinaryId}`)

      if (!response.data.success) {
        throw new Error(response.data.message || 'Delete failed')
      }

      this.uploadedFiles.delete(cloudinaryId)
    } catch (error) {
      console.error('❌ File delete error:', error)
      throw error
    }
  }

  /**
   * Get file info
   * @param {string} cloudinaryId
   * @returns {Object}
   */
  getFileInfo(cloudinaryId) {
    return this.uploadedFiles.get(cloudinaryId) || null
  }

  /**
   * Validate file before upload
   * @param {File} file
   * @param {Object} options
   * @returns {Object} - { valid: boolean, error: string }
   */
  validateFile(file, options = {}) {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = [
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
    } = options

    if (!file) {
      return { valid: false, error: 'Không có file được chọn' }
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File quá lớn. Tối đa ${(maxSize / 1024 / 1024).toFixed(0)}MB`
      }
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Loại file không được hỗ trợ. Chỉ chấp nhận: PDF, Word, Excel, Images, Text, ZIP`
      }
    }

    return { valid: true, error: null }
  }

  /**
   * Format file size for display
   * @param {number} bytes
   * @returns {string}
   */
  formatFileSize(bytes) {
    if (!bytes) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  /**
   * Get file extension
   * @param {string} fileName
   * @returns {string}
   */
  getFileExtension(fileName) {
    return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase()
  }

  /**
   * Get file icon based on type
   * @param {string} fileType or fileName
   * @returns {string} - Icon component name
   */
  getFileIcon(fileTypeOrName) {
    const ext = fileTypeOrName.includes('.')
      ? this.getFileExtension(fileTypeOrName)
      : fileTypeOrName

    const iconMap = {
      pdf: 'FilePdfOutlined',
      doc: 'FileWordOutlined',
      docx: 'FileWordOutlined',
      xls: 'FileExcelOutlined',
      xlsx: 'FileExcelOutlined',
      ppt: 'FilePptOutlined',
      pptx: 'FilePptOutlined',
      txt: 'FileTextOutlined',
      jpg: 'FileImageOutlined',
      jpeg: 'FileImageOutlined',
      png: 'FileImageOutlined',
      zip: 'FileZipOutlined',
      rar: 'FileZipOutlined'
    }

    return iconMap[ext] || 'FileOutlined'
  }
}

// Export singleton instance
const fileService = new FileService()
export default fileService
