const Class = require('../models/Class');
const Course = require('../models/Course');
const Teacher = require('../models/Teacher');
const Notification = require('../models/Notification');
const { autoGenerateScheduleForClass } = require('../services/aiAutomationService');
const { addTask } = require("../services/taskQueue");


// ======================================
// 🔹 Tạo lớp học mới
// ======================================
exports.createClass = async (req, res) => {
  try {
    const { title, course, teacher, maxStudents, startDate, endDate } = req.body;
    if (!title || !course || !teacher || !maxStudents || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    const courseDoc = await Course.findById(course);
    if (!courseDoc) return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });

    const teacherDoc = await Teacher.findById(teacher);
    if (!teacherDoc) return res.status(404).json({ success: false, message: 'Không tìm thấy giáo viên' });

    const classDoc = await Class.create({
      title,
      course,
      teacher,
      maxStudents,
      startDate,
      endDate,
    });

    await classDoc.populate([
      { path: 'course', select: 'title name' },
      { path: 'teacher', populate: { path: 'user', select: 'fullName username email' } },
    ]);

    res.status(201).json({ success: true, message: 'Tạo lớp học thành công', data: classDoc });
  } catch (err) {
    console.error('❌ Lỗi createClass:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================
// 🔹 Lấy tất cả lớp học
// ======================================
exports.getAllClasses = async (req, res) => {
  try {
    const { search, course, teacher, student, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) query.title = { $regex: search, $options: 'i' };
    if (course) query.course = course;
    if (status) query.status = status;

    let effectiveTeacher = teacher;
    let effectiveStudent = student;

    if (req.user?.role === 'lecturer') {
      const teacherDoc = await Teacher.findOne({ user: req.user._id }).select('_id');
      if (!teacherDoc) {
        return res.status(200).json({ success: true, total: 0, data: [] });
      }
      effectiveTeacher = teacherDoc._id;
    } else if (req.user?.role === 'student') {
      effectiveStudent = req.user._id;
    }

    if (effectiveTeacher) query.teacher = effectiveTeacher;
    if (effectiveStudent) query.students = { $in: [effectiveStudent] };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const classes = await Class.find(query)
      .populate('course', 'title name')
      .populate({ path: 'teacher', populate: { path: 'user', select: 'fullName username email' } })
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Class.countDocuments(query);
    res.status(200).json({ success: true, total, data: classes });
  } catch (err) {
    console.error('❌ Lỗi getAllClasses:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================
// 🔹 Lấy lớp học theo ID
// ======================================
exports.getClassById = async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id)
      .populate('course', 'title name')
      .populate({ path: 'teacher', populate: { path: 'user', select: 'fullName username email' } });

    if (!classDoc) return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    res.status(200).json({ success: true, data: classDoc });
  } catch (err) {
    console.error('❌ Lỗi getClassById:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================
// 🔹 Cập nhật lớp học
// ======================================
exports.updateClass = async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });

    Object.assign(classDoc, req.body);
    await classDoc.save();
    res.status(200).json({ success: true, message: 'Cập nhật thành công', data: classDoc });
  } catch (err) {
    console.error('❌ Lỗi updateClass:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================
// 🔹 Xóa lớp học
// ======================================
exports.deleteClass = async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });

    await classDoc.deleteOne();
    res.status(200).json({ success: true, message: 'Đã xóa lớp học' });
  } catch (err) {
    console.error('❌ Lỗi deleteClass:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================
// 🔹 Cập nhật ngày giảng dạy và AI auto schedule
// ======================================
exports.updateTeachingDaysForClass = async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id)
      .populate({
        path: "teacher",
        populate: { path: "user", select: "fullName email" },
      })
      .populate("course");

    if (!classDoc)
      return res.status(404).json({ success: false, message: "Không tìm thấy lớp học" });

    if (
      req.user.role !== "admin" &&
      (!classDoc.teacher || classDoc.teacher.user._id.toString() !== req.user._id.toString())
    )
      return res.status(403).json({ success: false, message: "Không có quyền cập nhật lớp này" });

    const { teachingDays } = req.body;
    if (!Array.isArray(teachingDays))
      return res.status(400).json({ success: false, message: "teachingDays phải là mảng ngày trong tuần" });

    const allowed = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const sanitized = teachingDays.map((d) => String(d).toLowerCase()).filter((d) => allowed.includes(d));

    classDoc.teachingDays = sanitized;
    await classDoc.save();

    // 🔹 Thêm vào hàng đợi tuần tự
    addTask(async () => {
      console.log(`🧠 [AI] Bắt đầu xếp lịch cho lớp ${classDoc.title}`);

      const result = await autoGenerateScheduleForClass(classDoc._id);

      await Notification.create({
        user: classDoc.teacher.user,
        title: result.success
          ? `AI đã xếp lịch lớp ${classDoc.title}`
          : `AI thất bại khi xếp lịch lớp ${classDoc.title}`,
        message: result.message,
        type: result.success ? "Info" : "Error",
        relatedModel: "Class",
        relatedId: classDoc._id,
      });

      console.log(`✅ [AI] Hoàn tất xếp lịch cho lớp ${classDoc.title}`);
    });

    res.status(200).json({
      success: true,
      message: "Đã cập nhật ngày dạy. AI sẽ lần lượt xếp lịch cho lớp này...",
      data: { classId: classDoc._id, teachingDays: sanitized },
    });
  } catch (err) {
    console.error("❌ Lỗi updateTeachingDaysForClass:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};