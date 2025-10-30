const Assessment = require('../models/Assessment')
const Enrollment = require('../models/Enrollment')
const Notification = require('../models/Notification')

// @desc    Tạo assessment mới
// @route   POST /api/assessments
// @access  Private (Admin, Manager, Teacher)
exports.createAssessment = async (req, res) => {
  try {
    const { title, enrollment, type, weight } = req.body

    // Validate required fields
    if (!title || !enrollment) {
      return res.status(400).json({
        success: false,
        message: 'Title và enrollment là bắt buộc'
      })
    }

    // Kiểm tra enrollment có tồn tại không
    const enrollmentDoc = await Enrollment.findById(enrollment).populate('user class')
    if (!enrollmentDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy enrollment'
      })
    }

    // Chỉ có thể tạo assessment cho enrollment đã approved
    if (enrollmentDoc.status !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể tạo assessment cho enrollment đã được phê duyệt'
      })
    }

    const assessment = await Assessment.create({
      title,
      enrollment,
      type,
      weight
    })

    await assessment.populate('enrollment')

    // Gửi notification cho student
    await Notification.create({
      user: enrollmentDoc.user._id,
      title: 'Bài tập mới',
      message: `Bạn có bài tập mới: ${title} trong lớp ${enrollmentDoc.class.title}`,
      type: 'Info',
      relatedModel: 'Assessment',
      relatedId: assessment._id
    })

    res.status(201).json({
      success: true,
      message: 'Tạo assessment thành công',
      data: assessment
    })
  } catch (error) {
    console.error('❌ Lỗi createAssessment:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Lấy tất cả assessments
// @route   GET /api/assessments
// @access  Private
exports.getAllAssessments = async (req, res) => {
  try {
    const { enrollment, type, status, page = 1, limit = 10 } = req.query

    const query = {}

    if (enrollment) {
      query.enrollment = enrollment
    }

    if (type) {
      query.type = type
    }

    if (status) {
      query.status = status
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const assessments = await Assessment.find(query)
      .populate({
        path: 'enrollment',
        populate: {
          path: 'user class',
          select: 'username email fullName title'
        }
      })
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 })

    const total = await Assessment.countDocuments(query)

    res.status(200).json({
      success: true,
      count: assessments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: assessments
    })
  } catch (error) {
    console.error('❌ Lỗi getAllAssessments:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Lấy assessment theo ID
// @route   GET /api/assessments/:id
// @access  Private
exports.getAssessmentById = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate({
        path: 'enrollment',
        populate: {
          path: 'user class'
        }
      })

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy assessment'
      })
    }

    // Kiểm tra quyền: chỉ student owner, teacher, admin, manager mới xem được
    const isOwner = req.user._id.toString() === assessment.enrollment.user._id.toString()
    const isAuthorized = ['admin', 'manager', 'lecturer'].includes(req.user.role)

    if (!isOwner && !isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem assessment này'
      })
    }

    res.status(200).json({
      success: true,
      data: assessment
    })
  } catch (error) {
    console.error('❌ Lỗi getAssessmentById:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Submit assessment (Student nộp bài)
// @route   PATCH /api/assessments/:id/submit
// @access  Private (Student owner)
exports.submitAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate({
        path: 'enrollment',
        populate: 'user class'
      })

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy assessment'
      })
    }

    // Kiểm tra quyền: chỉ student owner mới submit được
    if (req.user._id.toString() !== assessment.enrollment.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền submit assessment này'
      })
    }

    const { attachments } = req.body

    if (attachments) {
      assessment.attachments = attachments
    }

    await assessment.submit()
    await assessment.populate('enrollment')

    // Gửi notification cho teacher
    // TODO: Get teacher from class and send notification

    res.status(200).json({
      success: true,
      message: 'Nộp bài thành công',
      data: assessment
    })
  } catch (error) {
    console.error('❌ Lỗi submitAssessment:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server'
    })
  }
}

// @desc    Grade assessment (Teacher chấm điểm)
// @route   PATCH /api/assessments/:id/grade
// @access  Private (Admin, Manager, Teacher)
exports.gradeAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate({
        path: 'enrollment',
        populate: 'user class'
      })

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy assessment'
      })
    }

    const { score, feedback } = req.body

    if (score === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Score là bắt buộc'
      })
    }

    await assessment.grade(score, feedback)
    await assessment.populate('enrollment')

    // Gửi notification cho student
    await Notification.create({
      user: assessment.enrollment.user._id,
      title: 'Bài tập đã được chấm điểm',
      message: `Bài tập "${assessment.title}" đã được chấm điểm: ${score}/100`,
      type: 'Success',
      relatedModel: 'Assessment',
      relatedId: assessment._id
    })

    res.status(200).json({
      success: true,
      message: 'Chấm điểm thành công',
      data: assessment
    })
  } catch (error) {
    console.error('❌ Lỗi gradeAssessment:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server'
    })
  }
}

// @desc    Cập nhật assessment
// @route   PUT /api/assessments/:id
// @access  Private (Admin, Manager, Teacher)
exports.updateAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy assessment'
      })
    }

    const { title, type, weight, status } = req.body

    if (title !== undefined) assessment.title = title
    if (type !== undefined) assessment.type = type
    if (weight !== undefined) assessment.weight = weight
    if (status !== undefined) assessment.status = status

    await assessment.save()
    await assessment.populate('enrollment')

    res.status(200).json({
      success: true,
      message: 'Cập nhật assessment thành công',
      data: assessment
    })
  } catch (error) {
    console.error('❌ Lỗi updateAssessment:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Xóa assessment
// @route   DELETE /api/assessments/:id
// @access  Private (Admin, Manager)
exports.deleteAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy assessment'
      })
    }

    await assessment.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Xóa assessment thành công'
    })
  } catch (error) {
    console.error('❌ Lỗi deleteAssessment:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Lấy assessments của student hiện tại
// @route   GET /api/assessments/my-assessments
// @access  Private (Student)
exports.getMyAssessments = async (req, res) => {
  try {
    // Tìm tất cả enrollments của user
    const enrollments = await Enrollment.find({ user: req.user._id })

    const enrollmentIds = enrollments.map(e => e._id)

    const assessments = await Assessment.find({
      enrollment: { $in: enrollmentIds }
    })
      .populate({
        path: 'enrollment',
        populate: 'class'
      })
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: assessments.length,
      data: assessments
    })
  } catch (error) {
    console.error('❌ Lỗi getMyAssessments:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Tính điểm trung bình của enrollment
// @route   GET /api/assessments/enrollment/:enrollmentId/average
// @access  Private
exports.getEnrollmentAverage = async (req, res) => {
  try {
    const average = await Assessment.calculateEnrollmentAverage(req.params.enrollmentId)

    if (average === null) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có assessment nào được chấm điểm'
      })
    }

    res.status(200).json({
      success: true,
      data: {
        enrollmentId: req.params.enrollmentId,
        average: Math.round(average * 100) / 100
      }
    })
  } catch (error) {
    console.error('❌ Lỗi getEnrollmentAverage:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}
