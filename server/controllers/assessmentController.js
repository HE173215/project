const Assessment = require('../models/Assessment')
const Enrollment = require('../models/Enrollment')
const Notification = require('../models/Notification')
const Class = require('../models/Class')

// Validation helper
const validateAssessmentInput = (title, weight, type) => {
  const errors = []

  if (!title || title.trim().length === 0) {
    errors.push('Title không được để trống')
  }

  if (weight !== undefined) {
    if (isNaN(weight) || weight < 0 || weight > 100) {
      errors.push('Trọng số phải từ 0-100')
    }
  }

  if (type && !['Quiz', 'Assignment', 'Midterm', 'Final', 'Project', 'Presentation'].includes(type)) {
    errors.push('Loại bài không hợp lệ')
  }

  return errors
}

// @desc    Tạo assessment mới cho một học viên
// @route   POST /api/assessments
// @access  Private (Admin, Manager, Teacher)
exports.createAssessment = async (req, res) => {
  try {
    const { title, enrollment, type, weight, deadline } = req.body

    // Validate required fields
    if (!title || !enrollment) {
      return res.status(400).json({
        success: false,
        message: 'Title và enrollment là bắt buộc'
      })
    }

    // Validate input
    const validationErrors = validateAssessmentInput(title, weight, type)
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: validationErrors
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

    const assessmentData = {
      title,
      enrollment,
      type: type || 'Assignment',
      weight: weight !== undefined ? weight : 10
    }

    if (deadline) {
      assessmentData.deadline = new Date(deadline)
      // Validate deadline
      if (assessmentData.deadline <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Deadline phải lớn hơn thời gian hiện tại'
        })
      }
    }

    const assessment = await Assessment.create(assessmentData)
    await assessment.populate('enrollment')

    // Gửi notification cho student
    await Notification.create({
      user: enrollmentDoc.user._id,
      title: 'Bài tập mới',
      message: `Bạn có bài tập mới: ${title} trong lớp ${enrollmentDoc.class.title}`,
      type: 'Announcement',
      relatedModel: 'Assessment',
      relatedId: assessment._id,
      link: `/assessments/${assessment._id}`
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

// @desc    Giao bài tập cho toàn bộ học viên trong lớp
// @route   POST /api/assessments/create-for-class
// @access  Private (Teacher, Admin, Manager)
exports.createAssessmentForClass = async (req, res) => {
  try {
    const { title, classId, deadline, attachments } = req.body

    // Validate required fields
    if (!title || !classId) {
      return res.status(400).json({
        success: false,
        message: 'Title và classId là bắt buộc'
      })
    }

    // Validate title
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề bài tập không được để trống'
      })
    }

    // Kiểm tra lớp có tồn tại không
    const classDoc = await Class.findById(classId).populate('teacher')
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp'
      })
    }

    // Kiểm tra quyền: chỉ giáo viên của lớp, admin hoặc manager mới giao bài được
    // Compare Teacher.user (User ID) with req.user._id
    const isTeacher = req.user.role === 'lecturer' &&
                      classDoc.teacher &&
                      classDoc.teacher.user &&
                      classDoc.teacher.user.toString() === req.user._id.toString()
    const isAuthorized = ['admin', 'manager'].includes(req.user.role) || isTeacher

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền giao bài cho lớp này'
      })
    }

    // Tìm tất cả enrollments đã được approved trong lớp
    const enrollments = await Enrollment.find({
      class: classId,
      status: 'Approved'
    }).populate('user')

    if (enrollments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lớp không có học viên nào'
      })
    }

    const assessmentData = {
      type: 'Assignment',
      weight: 10
    }

    // Validate and set deadline
    if (deadline) {
      const deadlineDate = new Date(deadline)
      if (deadlineDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Deadline phải lớn hơn thời gian hiện tại'
        })
      }
      assessmentData.deadline = deadlineDate
    } else {
      return res.status(400).json({
        success: false,
        message: 'Deadline là bắt buộc'
      })
    }

    // Validate and add attachments if provided
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      // Validate each attachment has required fields
      for (const attachment of attachments) {
        if (!attachment.url || !attachment.originalName) {
          return res.status(400).json({
            success: false,
            message: 'Mỗi file phải có URL và tên file'
          })
        }
      }
      assessmentData.attachments = attachments
    }

    // Tạo assessment cho từng học viên
    const createdAssessments = []
    const notifications = []

    for (const enrollment of enrollments) {
      const assessment = await Assessment.create({
        ...assessmentData,
        title,
        enrollment: enrollment._id
      })

      createdAssessments.push(assessment)

      // Chuẩn bị notification
      notifications.push({
        user: enrollment.user._id,
        title: 'Bài tập mới',
        message: `Bạn có bài tập mới: ${title} trong lớp ${classDoc.title}`,
        type: 'Announcement',
        relatedModel: 'Assessment',
        relatedId: assessment._id,
        link: `/assessments/${assessment._id}`
      })
    }

    // Gửi notifications hàng loạt
    if (notifications.length > 0) {
      await Notification.insertMany(notifications)
    }

    res.status(201).json({
      success: true,
      message: `Giao bài tập thành công cho ${createdAssessments.length} học viên`,
      data: {
        count: createdAssessments.length,
        assessments: createdAssessments
      }
    })
  } catch (error) {
    console.error('❌ Lỗi createAssessmentForClass:', error)
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
        populate: [
          {
            path: 'user',
            select: 'username email fullName'
          },
          {
            path: 'class',
            select: 'title'
          }
        ]
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
        populate: [
          {
            path: 'user'
          },
          {
            path: 'class'
          }
        ]
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
        populate: [
          {
            path: 'user'
          },
          {
            path: 'class',
            populate: {
              path: 'teacher'
            }
          }
        ]
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

    // Kiểm tra assessment đã được submit chưa
    if (assessment.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Assessment đã được nộp, không thể nộp lại'
      })
    }

    const { attachments } = req.body

    // Validate attachments - now expecting array of file objects from Cloudinary
    if (attachments && !Array.isArray(attachments)) {
      return res.status(400).json({
        success: false,
        message: 'Attachments phải là một mảng'
      })
    }

    if (attachments && attachments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng upload ít nhất một file'
      })
    }

    if (attachments) {
      // Validate that each attachment has required fields
      for (const attachment of attachments) {
        if (!attachment.url || !attachment.originalName) {
          console.error('❌ Invalid attachment:', attachment)
          return res.status(400).json({
            success: false,
            message: 'Mỗi file phải có URL và tên file'
          })
        }
      }
      assessment.attachments = attachments
    }

    await assessment.submit()
    await assessment.populate('enrollment')

    // Gửi notification cho teacher
    if (assessment.enrollment.class && assessment.enrollment.class.teacher) {
      const teacherUserId = assessment.enrollment.class.teacher.user || assessment.enrollment.class.teacher._id

      await Notification.create({
        user: teacherUserId,
        title: 'Học viên nộp bài',
        message: `${assessment.enrollment.user.fullName} đã nộp bài: "${assessment.title}" trong lớp ${assessment.enrollment.class.title}`,
        type: 'Info',
        relatedModel: 'Assessment',
        relatedId: assessment._id,
        link: `/assessments/${assessment._id}`
      })
    }

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

// @desc    Chấm điểm hàng loạt cho nhiều assessment
// @route   POST /api/assessments/bulk-grade
// @access  Private (Admin, Manager, Teacher)
exports.bulkGradeAssessments = async (req, res) => {
  try {
    const { grades } = req.body // grades: [{ assessmentId, score, feedback }, ...]

    if (!grades || !Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Grades phải là một mảng không rỗng'
      })
    }

    if (grades.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể chấm điểm tối đa 50 bài một lần'
      })
    }

    const results = {
      success: [],
      failed: []
    }

    const notifications = []

    for (const gradeData of grades) {
      try {
        const { assessmentId, score, feedback } = gradeData

        // Validate
        if (!assessmentId || score === undefined) {
          results.failed.push({
            assessmentId,
            error: 'AssessmentId và score là bắt buộc'
          })
          continue
        }

        if (isNaN(score) || score < 0 || score > 100) {
          results.failed.push({
            assessmentId,
            error: 'Score phải từ 0 đến 100'
          })
          continue
        }

        const assessment = await Assessment.findById(assessmentId)
          .populate({
            path: 'enrollment',
            populate: 'user'
          })

        if (!assessment) {
          results.failed.push({
            assessmentId,
            error: 'Không tìm thấy assessment'
          })
          continue
        }

        if (assessment.status !== 'Submitted' && assessment.status !== 'Late') {
          results.failed.push({
            assessmentId,
            error: `Chỉ có thể chấm điểm assessment trong trạng thái Submitted hoặc Late, hiện tại là ${assessment.status}`
          })
          continue
        }

        // Grade the assessment
        await assessment.grade(score, feedback || '')

        results.success.push({
          assessmentId,
          assessment
        })

        // Prepare notification
        notifications.push({
          user: assessment.enrollment.user._id,
          title: 'Bài tập đã được chấm điểm',
          message: `Bài tập "${assessment.title}" đã được chấm điểm: ${score}/100`,
          type: 'Success',
          relatedModel: 'Assessment',
          relatedId: assessment._id,
          link: `/assessments/${assessment._id}`
        })
      } catch (error) {
        results.failed.push({
          assessmentId: gradeData.assessmentId,
          error: error.message
        })
      }
    }

    // Send all notifications at once
    if (notifications.length > 0) {
      await Notification.insertMany(notifications)
    }

    res.status(200).json({
      success: true,
      message: `Chấm điểm thành công ${results.success.length} bài, thất bại ${results.failed.length} bài`,
      data: {
        successCount: results.success.length,
        failedCount: results.failed.length,
        results
      }
    })
  } catch (error) {
    console.error('❌ Lỗi bulkGradeAssessments:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
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

// @desc    Lấy assessments của student hiện tại với filter và pagination
// @route   GET /api/assessments/my-assessments
// @access  Private (Student)
exports.getMyAssessments = async (req, res) => {
  try {
    const { status, type, classId, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = req.query

    // Tìm tất cả enrollments của user
    const enrollments = await Enrollment.find({ user: req.user._id }).select('_id')

    if (enrollments.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        page: 1,
        pages: 0,
        data: []
      })
    }

    const enrollmentIds = enrollments.map(e => e._id)

    // Xây dựng query filter
    const query = {
      enrollment: { $in: enrollmentIds }
    }

    // Filter by status
    if (status) {
      const statusValues = status.split(',').map(s => s.trim())
      if (statusValues.length === 1) {
        query.status = statusValues[0]
      } else {
        query.status = { $in: statusValues }
      }
    }

    // Filter by type
    if (type) {
      const typeValues = type.split(',').map(t => t.trim())
      if (typeValues.length === 1) {
        query.type = typeValues[0]
      } else {
        query.type = { $in: typeValues }
      }
    }

    // Filter by class
    if (classId) {
      query['enrollment.class'] = classId
    }

    // Validate sort
    const validSortFields = ['createdAt', 'title', 'submissionDate', 'deadline', 'status']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const sortObj = {}
    sortObj[sortField] = sortOrder === 'asc' ? 1 : -1

    // Pagination
    const pageNum = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10))
    const skip = (pageNum - 1) * limitNum

    // Execute query
    const assessments = await Assessment.find(query)
      .populate({
        path: 'enrollment',
        populate: [
          {
            path: 'class'
          },
          {
            path: 'course'
          }
        ]
      })
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)

    // Get total count
    const total = await Assessment.countDocuments(query)

    res.status(200).json({
      success: true,
      count: assessments.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
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

// @desc    Lấy danh sách bài chưa được chấm điểm cho một lớp
// @route   GET /api/assessments/ungraded/class/:classId
// @access  Private (Teacher, Admin, Manager)
exports.getUngradedForClass = async (req, res) => {
  try {
    const { classId } = req.params
    const { type } = req.query

    // Validate classId
    if (!classId) {
      return res.status(400).json({
        success: false,
        message: 'ClassId là bắt buộc'
      })
    }

    // Check if class exists
    const classDoc = await Class.findById(classId).populate('teacher')
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp'
      })
    }

    // Kiểm tra quyền: chỉ giáo viên của lớp, admin hoặc manager mới xem được
    const isTeacher = req.user.role === 'lecturer' &&
                      classDoc.teacher &&
                      classDoc.teacher.user &&
                      classDoc.teacher.user.toString() === req.user._id.toString()
    const isAuthorized = ['admin', 'manager'].includes(req.user.role) || isTeacher

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem bài chưa chấm cho lớp này'
      })
    }

    // Get ungraded assessments
    const assessments = await Assessment.getUngraded(classId, type || null)

    res.status(200).json({
      success: true,
      count: assessments.length,
      data: assessments
    })
  } catch (error) {
    console.error('❌ Lỗi getUngradedForClass:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Tự động đánh dấu các bài muộn deadline
// @route   POST /api/assessments/mark-late
// @access  Private (Admin, Manager)
exports.markLateSubmissions = async (req, res) => {
  try {
    const result = await Assessment.markLateSubmissions()

    res.status(200).json({
      success: true,
      message: `Đã đánh dấu ${result.modifiedCount} bài muộn`,
      data: {
        modifiedCount: result.modifiedCount
      }
    })
  } catch (error) {
    console.error('❌ Lỗi markLateSubmissions:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Lấy danh sách các assessment có deadline sắp hết hạn cho student
// @route   GET /api/assessments/my-pending
// @access  Private (Student)
exports.getMyPendingAssessments = async (req, res) => {
  try {
    // Tìm tất cả enrollments của user
    const enrollments = await Enrollment.find({ user: req.user._id }).select('_id')

    if (enrollments.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      })
    }

    const enrollmentIds = enrollments.map(e => e._id)

    // Lấy assessments Pending hoặc Submitted
    const assessments = await Assessment.find({
      enrollment: { $in: enrollmentIds },
      status: { $in: ['Pending', 'Submitted'] }
    })
      .populate({
        path: 'enrollment',
        populate: [
          {
            path: 'class'
          },
          {
            path: 'course'
          }
        ]
      })
      .sort({ deadline: 1 }) // Sắp xếp theo deadline

    res.status(200).json({
      success: true,
      count: assessments.length,
      data: assessments
    })
  } catch (error) {
    console.error('❌ Lỗi getMyPendingAssessments:', error)
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
