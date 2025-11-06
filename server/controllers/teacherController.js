const Teacher = require("../models/Teacher");
const User = require("../models/User");
const Class = require("../models/Class");
const {
  autoGenerateScheduleForClass,
} = require("../services/aiAutomationService");

// ==============================================
// 🔹 TẠO GIẢNG VIÊN
// ==============================================
exports.createTeacher = async (req, res) => {
  try {
    const { userId, title, name, email, expertise, department, level } =
      req.body;
    const targetUserId = userId || req.user._id;

    // Chỉ admin hoặc chính user đó mới được tạo
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== targetUserId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền tạo teacher profile cho user khác",
      });
    }

    const user = await User.findById(targetUserId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy user" });
    if (user.role !== "lecturer") {
      return res.status(400).json({
        success: false,
        message: "User phải có role là lecturer",
      });
    }

    const existing = await Teacher.findOne({ user: targetUserId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Teacher profile đã tồn tại",
      });
    }

    const teacher = await Teacher.create({
      user: targetUserId,
      title,
      name: name || user.fullName || user.username,
      email: email || user.email,
      expertise,
      department,
      level,
    });

    await teacher.populate("user");

    res.status(201).json({
      success: true,
      message: "Tạo teacher profile thành công",
      data: teacher,
    });
  } catch (error) {
    console.error("❌ Lỗi createTeacher:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// ==============================================
// 🔹 LẤY DANH SÁCH GIẢNG VIÊN
// ==============================================
exports.getAllTeachers = async (req, res) => {
  try {
    const { search, department, level, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { expertise: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
      ];
    }

    if (department) query.department = department;
    if (level) query.level = level;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const teachers = await Teacher.find(query)
      .populate("user", "username email fullName avatar phone isVerified")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Teacher.countDocuments(query);

    res.status(200).json({
      success: true,
      count: teachers.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: teachers,
    });
  } catch (error) {
    console.error("❌ Lỗi getAllTeachers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================
// 🔹 LẤY GIẢNG VIÊN THEO ID
// ==============================================
exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate(
      "user",
      "username email fullName avatar phone isVerified"
    );

    if (!teacher)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy teacher" });

    res.status(200).json({ success: true, data: teacher });
  } catch (error) {
    console.error("❌ Lỗi getTeacherById:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================
// 🔹 LẤY GIẢNG VIÊN THEO USER ID
// ==============================================
exports.getTeacherByUserId = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.params.userId }).populate(
      "user",
      "username email fullName avatar phone isVerified"
    );

    if (!teacher)
      return res
        .status(404)
        .json({
          success: false,
          message: "Không tìm thấy teacher profile cho user này",
        });

    res.status(200).json({ success: true, data: teacher });
  } catch (error) {
    console.error("❌ Lỗi getTeacherByUserId:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================
// 🔹 CẬP NHẬT THÔNG TIN GIẢNG VIÊN
// ==============================================
exports.updateTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy teacher" });

    // Chỉ admin hoặc chính giảng viên được update
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== teacher.user.toString()
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Không có quyền cập nhật teacher profile này",
        });
    }

    const { title, name, email, expertise, department, level, teachingDays } =
      req.body;

    if (title !== undefined) teacher.title = title;
    if (name !== undefined) teacher.name = name;
    if (email !== undefined) teacher.email = email;
    if (expertise !== undefined) teacher.expertise = expertise;
    if (department !== undefined) teacher.department = department;
    if (level !== undefined) teacher.level = level;
    if (Array.isArray(teachingDays)) teacher.teachingDays = teachingDays;

    await teacher.save();
    await teacher.populate("user");

    res.status(200).json({
      success: true,
      message: "Cập nhật teacher profile thành công",
      data: teacher,
    });
  } catch (error) {
    console.error("❌ Lỗi updateTeacher:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================
// 🔹 CẬP NHẬT NGÀY DẠY & TỰ ĐỘNG XẾP LỊCH
// ==============================================
exports.updateTeachingDays = async (req, res) => {
  try {
    const { teachingDays } = req.body;

    if (!Array.isArray(teachingDays) || teachingDays.length === 0) {
      return res.status(400).json({
        success: false,
        message: "teachingDays phải là mảng hợp lệ",
      });
    }

    const allowed = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const sanitized = teachingDays
      .map((d) => String(d).toLowerCase())
      .filter((d) => allowed.includes(d));

    // 🔹 Tìm hoặc tạo mới teacher profile
    let teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) {
      teacher = await Teacher.create({
        user: req.user._id,
        name: req.user.fullName || req.user.username,
        email: req.user.email,
        teachingDays: sanitized,
      });
    } else {
      teacher.teachingDays = sanitized;
      await teacher.save();
    }

    // 🔹 Cập nhật teachingDays cho tất cả lớp mà giảng viên đang dạy
    const activeClasses = await Class.find({
      teacher: teacher._id,
      status: "Active",
    });
    for (const cls of activeClasses) {
      cls.teachingDays = sanitized;
      await cls.save();
    }

    // 🔹 Gọi AI để tự động xếp lịch học cho từng lớp
    const aiResults = [];
    for (const cls of activeClasses) {
      const aiResult = await autoGenerateScheduleForClass(cls._id);
      aiResults.push({
        classId: cls._id,
        classTitle: cls.title,
        aiResult,
      });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật ngày giảng dạy và tự động xếp lịch thành công",
      data: { teachingDays: sanitized, aiResults },
    });
  } catch (error) {
    console.error("❌ Lỗi updateTeachingDays:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================
// 🔹 XÓA GIẢNG VIÊN
// ==============================================
exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy teacher" });

    await teacher.deleteOne();

    res.status(200).json({
      success: true,
      message: "Xóa teacher profile thành công",
    });
  } catch (error) {
    console.error("❌ Lỗi deleteTeacher:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
