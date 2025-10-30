const Enrollment = require('../models/Enrollment')
const Class = require('../models/Class')
const Course = require('../models/Course')
const Notification = require('../models/Notification')
const {
  requestAssignment,
  applyAssignment,
  shouldUseAIResult
} = require('../services/aiAutomationService')

/**
 * @desc   Student đăng ký khóa học → chờ phê duyệt
 * @route  POST /api/enrollments/course-request
 * @access Private (Student)
 */
exports.createCourseEnrollmentRequest = async (req, res) => {
  try {
    const { courseId } = req.body
    const userId = req.user._id

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID là bắt buộc'
      })
    }

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      })
    }

    if (course.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Khóa học hiện không khả dụng để đăng ký'
      })
    }

    // Kiểm tra trùng
    const exists = await Enrollment.findOne({
      user: userId,
      course: courseId
    })
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã gửi yêu cầu cho khóa học này rồi'
      })
    }

    // ✅ Tạo enrollment dạng “yêu cầu chờ phê duyệt”
    const enrollment = await Enrollment.create({
      user: userId,
      course: courseId,
      status: 'PendingApproval'
    })

    await Notification.create({
      user: userId,
      title: 'Gửi yêu cầu đăng ký khóa học thành công',
      message: `Bạn đã gửi yêu cầu tham gia khóa "${course.title}". Vui lòng chờ Admin/Manager phê duyệt.`,
      type: 'Info',
      relatedModel: 'Enrollment',
      relatedId: enrollment._id
    })

    res.status(201).json({
      success: true,
      message: 'Đăng ký khóa học thành công, vui lòng chờ phê duyệt.',
      data: enrollment
    })
  } catch (error) {
    console.error('❌ Lỗi createCourseEnrollmentRequest:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc   Admin/Manager phê duyệt yêu cầu khóa học → tự động chọn lớp phù hợp
 * @route  PATCH /api/enrollments/:id/approve
 * @access Private (Admin, Manager)
 */
exports.approveEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('user')
      .populate('course')

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy enrollment' })
    }

    if (enrollment.status !== 'PendingApproval') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể phê duyệt các yêu cầu đang chờ'
      })
    }

    enrollment.status = 'Approved'
    enrollment.approvalDate = new Date()
    await enrollment.save()

    await Notification.create({
      user: enrollment.user._id,
      title: 'Yêu cầu đăng ký được phê duyệt',
      message: `Admin/Manager đã phê duyệt khóa "${enrollment.course.title}". Vui lòng chờ được xếp lớp.`,
      type: 'Success',
      relatedModel: 'Enrollment',
      relatedId: enrollment._id
    })

    res.status(200).json({
      success: true,
      message: 'Đã phê duyệt yêu cầu. Vui lòng xếp lớp cho sinh viên.',
      data: enrollment
    })
  } catch (error) {
    console.error('❌ Lỗi approveEnrollment:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.assignClassAutomatically = async (req, res) => {
  try {
    const { success, data, message } = await requestAssignment({
      enrollmentId: req.params.id,
      allowedStatuses: ['Approved']
    })

    if (!success || !shouldUseAIResult(data)) {
      return res.status(400).json({
        success: false,
        message: message || 'AI chưa đưa ra đề xuất phù hợp',
        data
      })
    }

    const enrollment = await applyAssignment({
      enrollmentId: req.params.id,
      classId: data.suggestedClassId
    })

    await Notification.create({
      user: enrollment.user,
      title: 'Bạn đã được xếp lớp',
      message: `Bạn đã được xếp vào lớp mới cho khóa học của mình. ${data.reasoning || ''}`.trim(),
      type: 'Success',
      relatedModel: 'Enrollment',
      relatedId: enrollment._id
    })

    res.status(200).json({
      success: true,
      message: 'Xếp lớp tự động thành công',
      data: {
        enrollment,
        ai: {
          provider: 'heuristic-engine',
          confidence: data.confidence ?? null,
          reasoning: data.reasoning ?? ''
        }
      }
    })
  } catch (error) {
    console.error('❌ Lỗi assignClassAutomatically:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.reassignEnrollment = async (req, res) => {
  try {
    const { classId } = req.body
    if (!classId) {
      return res.status(400).json({ success: false, message: 'classId là bắt buộc' })
    }

    const enrollment = await Enrollment.findById(req.params.id)
      .populate('user')
      .populate('course')

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy enrollment' })
    }

    const newClass = await Class.findById(classId)
    if (!newClass) {
      return res.status(404).json({ success: false, message: 'Lớp không tồn tại' })
    }

    if (!newClass.hasAvailableSlots()) {
      return res.status(400).json({ success: false, message: 'Lớp này đã đầy' })
    }

    const previousClassId = enrollment.class

    enrollment.class = newClass._id
    enrollment.status = 'Approved'
    enrollment.approvalDate = new Date()
    await enrollment.save()

    if (previousClassId) {
      const previousClass = await Class.findById(previousClassId)
      if (previousClass && previousClass.currentStudents > 0) {
        previousClass.currentStudents = Math.max(0, previousClass.currentStudents - 1)
        await previousClass.save()
      }
    }

    newClass.currentStudents += 1
    await newClass.save()

    await Notification.create({
      user: enrollment.user._id || enrollment.user,
      title: 'Lịch học của bạn đã được cập nhật',
      message: `Admin/Manager đã chuyển bạn sang lớp "${newClass.title}" cho khóa "${enrollment.course.title}".`,
      type: 'Info',
      relatedModel: 'Enrollment',
      relatedId: enrollment._id
    })

    res.status(200).json({
      success: true,
      message: 'Đã cập nhật lớp cho enrollment',
      data: enrollment
    })
  } catch (error) {
    console.error('❌ Lỗi reassignEnrollment:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc   Reject enrollment request
 * @route  PATCH /api/enrollments/:id/reject
 * @access Private (Admin, Manager)
 */
exports.rejectEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id).populate('user').populate('course')
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' })
    }

    if (enrollment.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể từ chối các yêu cầu đang chờ'
      })
    }

    enrollment.status = 'Rejected'
    await enrollment.save()

    await Notification.create({
      user: enrollment.user._id,
      title: 'Yêu cầu đăng ký bị từ chối',
      message: `Khóa "${enrollment.course.title}" của bạn đã bị từ chối.`,
      type: 'Warning',
      relatedModel: 'Enrollment',
      relatedId: enrollment._id
    })

    res.status(200).json({
      success: true,
      message: 'Từ chối yêu cầu thành công',
      data: enrollment
    })
  } catch (error) {
    console.error('❌ Lỗi rejectEnrollment:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc   Lấy danh sách enrollment
 * @route  GET /api/enrollments
 * @access Private (Admin, Manager)
 */
exports.getAllEnrollments = async (req, res) => {
  try {
    const { status } = req.query
    const query = {}
    if (status) query.status = status

    const data = await Enrollment.find(query)
      .populate('user', 'fullName email')
      .populate('course', 'title')
      .populate('class', 'title')

    res.status(200).json({
      success: true,
      count: data.length,
      data
    })
  } catch (error) {
    console.error('❌ Lỗi getAllEnrollments:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc   Student xem danh sách yêu cầu của mình
 * @route  GET /api/enrollments/my-enrollments
 * @access Private (Student)
 */
exports.getMyEnrollments = async (req, res) => {
  try {
    const data = await Enrollment.find({ user: req.user._id })
      .populate('course', 'title')
      .populate('class', 'title')
    res.status(200).json({ success: true, count: data.length, data })
  } catch (error) {
    console.error('❌ Lỗi getMyEnrollments:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.dropEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({ _id: req.params.id, user: req.user._id }).populate('course class')

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy enrollment' })
    }

    if (enrollment.status === 'DropRequested') {
      return res.status(400).json({ success: false, message: 'Bạn đã gửi yêu cầu hủy trước đó, vui lòng chờ phê duyệt' })
    }

    if (enrollment.status !== 'Approved') {
      return res.status(400).json({ success: false, message: 'Chỉ có thể gửi yêu cầu hủy khi lớp đã được phê duyệt' })
    }

    enrollment.status = 'DropRequested'
    enrollment.dropRequestDate = new Date()
    await enrollment.save()

    await Notification.create({
      user: req.user._id,
      title: 'Đã gửi yêu cầu hủy lớp',
      message: `Bạn đã gửi yêu cầu hủy lớp "${enrollment.class?.title || ''}" của khóa "${enrollment.course?.title || ''}". Vui lòng chờ Admin/Manager phê duyệt.`,
      type: 'Info',
      relatedModel: 'Enrollment',
      relatedId: enrollment._id
    })

    res.status(200).json({ success: true, message: 'Đã gửi yêu cầu hủy lớp, vui lòng chờ phê duyệt', data: enrollment })
  } catch (error) {
    console.error('❌ Lỗi dropEnrollment:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.approveDropEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id).populate('user course class')

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy enrollment' })
    }

    if (enrollment.status !== 'DropRequested') {
      return res.status(400).json({ success: false, message: 'Enrollment không ở trạng thái chờ hủy' })
    }

    await enrollment.drop()

    await Notification.create({
      user: enrollment.user._id || enrollment.user,
      title: 'Yêu cầu hủy lớp được phê duyệt',
      message: `Admin/Manager đã chấp nhận yêu cầu hủy lớp "${enrollment.class?.title || ''}" của khóa "${enrollment.course?.title || ''}".`,
      type: 'Success',
      relatedModel: 'Enrollment',
      relatedId: enrollment._id
    })

    res.status(200).json({ success: true, message: 'Đã phê duyệt yêu cầu hủy lớp', data: enrollment })
  } catch (error) {
    console.error('❌ Lỗi approveDropEnrollment:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.rejectDropEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id).populate('user course class')

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy enrollment' })
    }

    if (enrollment.status !== 'DropRequested') {
      return res.status(400).json({ success: false, message: 'Enrollment không ở trạng thái chờ hủy' })
    }

    enrollment.status = 'Approved'
    enrollment.dropRequestDate = null
    await enrollment.save()

    await Notification.create({
      user: enrollment.user._id || enrollment.user,
      title: 'Yêu cầu hủy lớp bị từ chối',
      message: `Yêu cầu hủy lớp "${enrollment.class?.title || ''}" của khóa "${enrollment.course?.title || ''}" đã bị từ chối. Bạn vẫn còn trong lớp.`,
      type: 'Warning',
      relatedModel: 'Enrollment',
      relatedId: enrollment._id
    })

    res.status(200).json({ success: true, message: 'Đã từ chối yêu cầu hủy lớp', data: enrollment })
  } catch (error) {
    console.error('❌ Lỗi rejectDropEnrollment:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}
