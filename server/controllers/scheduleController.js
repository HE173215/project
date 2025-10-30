const Schedule = require('../models/Schedule')
const Class = require('../models/Class')
const Room = require('../models/Room')

// =======================================================
// 🔹 CREATE SCHEDULE
// =======================================================
exports.createSchedule = async (req, res) => {
  try {
    const { classId, date, startTime, endTime, room, topic, notes } = req.body

    if (!classId || !date || !startTime || !endTime || !room) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc'
      })
    }

    const classDoc = await Class.findById(classId)
    if (!classDoc)
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' })

    const roomDoc = await Room.findById(room)
    if (!roomDoc)
      return res.status(404).json({ success: false, message: 'Không tìm thấy phòng học' })

    if (roomDoc.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: 'Phòng học không khả dụng'
      })
    }

    // Kiểm tra trùng phòng
    const hasConflict = await Schedule.checkRoomConflict(room, date, startTime, endTime)
    if (hasConflict)
      return res.status(400).json({ success: false, message: 'Phòng học đã có lịch trong khung giờ này' })

    const schedule = await Schedule.create({
      class: classId,
      date,
      startTime,
      endTime,
      room,
      topic,
      notes
    })

    await schedule.populate(['class', 'room'])

    res.status(201).json({
      success: true,
      message: 'Tạo lịch học thành công',
      data: schedule
    })
  } catch (error) {
    console.error('❌ Lỗi createSchedule:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// =======================================================
// 🔹 GET ALL SCHEDULES (với phân trang chuẩn)
// =======================================================
exports.getAllSchedules = async (req, res) => {
  try {
    const { classId, room, date, status, page = 1, limit = 10 } = req.query
    const query = {}

    if (classId) query.class = classId
    if (room) query.room = room
    if (status) query.status = status

    // Lọc theo ngày cụ thể
    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      query.date = { $gte: startOfDay, $lte: endOfDay }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const total = await Schedule.countDocuments(query)

    const schedules = await Schedule.find(query)
      .populate({
        path: 'class',
        select: 'title course teacher',
        populate: [
          { path: 'course', select: 'title name' },
          { path: 'teacher', populate: { path: 'user', select: 'fullName email' } }
        ]
      })
      .populate('room')
      .sort({ date: 1, startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit))

    res.status(200).json({
      success: true,
      total,
      count: schedules.length,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: schedules
    })
  } catch (error) {
    console.error('❌ Lỗi getAllSchedules:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// =======================================================
// 🔹 GET SCHEDULE BY ID
// =======================================================
exports.getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate('class')
      .populate('room')

    if (!schedule)
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch học' })

    res.status(200).json({ success: true, data: schedule })
  } catch (error) {
    console.error('❌ Lỗi getScheduleById:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// =======================================================
// 🔹 UPDATE SCHEDULE
// =======================================================
exports.updateSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
    if (!schedule)
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch học' })

    const { classId, date, startTime, endTime, room, topic, notes, status } = req.body

    // Validate class/room nếu thay đổi
    if (classId && classId !== schedule.class.toString()) {
      const classDoc = await Class.findById(classId)
      if (!classDoc)
        return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' })
    }

    if (room && room !== schedule.room.toString()) {
      const roomDoc = await Room.findById(room)
      if (!roomDoc)
        return res.status(404).json({ success: false, message: 'Không tìm thấy phòng học' })

      const checkDate = date || schedule.date
      const checkStart = startTime || schedule.startTime
      const checkEnd = endTime || schedule.endTime
      const hasConflict = await Schedule.checkRoomConflict(room, checkDate, checkStart, checkEnd, schedule._id)
      if (hasConflict)
        return res.status(400).json({ success: false, message: 'Phòng học đã có lịch trong khung giờ này' })
    }

    Object.assign(schedule, { class: classId, date, startTime, endTime, room, topic, notes, status })
    await schedule.save()
    await schedule.populate(['class', 'room'])

    res.status(200).json({ success: true, message: 'Cập nhật lịch học thành công', data: schedule })
  } catch (error) {
    console.error('❌ Lỗi updateSchedule:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// =======================================================
// 🔹 DELETE SCHEDULE
// =======================================================
exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
    if (!schedule)
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch học' })

    await schedule.deleteOne()
    res.status(200).json({ success: true, message: 'Xóa lịch học thành công' })
  } catch (error) {
    console.error('❌ Lỗi deleteSchedule:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// =======================================================
// 🔹 GET SCHEDULES BY CLASS ID (Không phân trang, cho frontend hiển thị nhanh)
// =======================================================
exports.getSchedulesByClass = async (req, res) => {
  try {
    const schedules = await Schedule.find({ class: req.params.classId })
      .populate('room')
      .sort({ date: 1, startTime: 1 })

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules
    })
  } catch (error) {
    console.error('❌ Lỗi getSchedulesByClass:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}
