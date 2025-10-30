const Course = require("../models/Course");
const User = require("../models/User");

// --- Utility functions ---
const sanitizeIdList = (value) => {
  if (!value) return [];
  const items = Array.isArray(value) ? value : [value];
  return [...new Set(items.filter(Boolean).map((id) => id.toString()))];
};

const validateManagers = async (managerIds) => {
  if (!managerIds.length) return [];
  const managers = await User.find({ _id: { $in: managerIds } }).select(
    "_id role"
  );

  const foundIds = managers.map((m) => m._id.toString());
  const missing = managerIds.filter((id) => !foundIds.includes(id));
  if (missing.length) {
    const err = new Error("Một hoặc nhiều manager không tồn tại");
    err.statusCode = 404;
    err.data = missing;
    throw err;
  }

  const invalid = managers.filter((m) => m.role !== "manager");
  if (invalid.length) {
    const err = new Error("User được chỉ định phải có role manager");
    err.statusCode = 400;
    throw err;
  }

  return managers.map((m) => m._id);
};

const handleError = (res, error, ctx) => {
  console.error(`❌ Error [${ctx}]:`, error);
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Lỗi server",
    ...(error.data ? { data: error.data } : {}),
  });
};

// --- Controllers ---

// 🟢 Tạo khóa học (chỉ admin)
exports.createCourse = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Chỉ admin mới được tạo khóa học" });
    }

    const {
      title,
      name,
      expertise,
      description,
      duration,
      level,
      status,
      managers,
    } = req.body;
    if (!title || !name) {
      return res
        .status(400)
        .json({ success: false, message: "Title và name là bắt buộc" });
    }

    const existing = await Course.findOne({ name });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Mã khóa học đã tồn tại" });
    }

    const managerIds = await validateManagers(sanitizeIdList(managers));

    const course = await Course.create({
      title,
      name,
      expertise,
      description,
      duration,
      level,
      status,
      managers: managerIds,
    });

    await course.populate("managers", "username email fullName role");

    res.status(201).json({
      success: true,
      message: "Tạo khóa học thành công",
      data: course,
    });
  } catch (err) {
    return handleError(res, err, "createCourse");
  }
};

// 🟡 Lấy danh sách khóa học (role-based)
exports.getAllCourses = async (req, res) => {
  try {
    const { search, level, status, manager, page = 1, limit = 10 } = req.query;
    const query = {};

    // --- Search ---
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { expertise: { $regex: search, $options: "i" } },
      ];
    }

    if (level) query.level = level;
    if (status) query.status = status;
    if (manager) query.managers = manager;

    // --- Role-based Filtering ---
    if (req.user?.role === "manager") {
      query.managers = req.user._id;
    } else if (req.user?.role === "student") {
      query.status = "Active";
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const courses = await Course.find(query)
      .populate("managers", "username email fullName role")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments(query);

    res.status(200).json({
      success: true,
      count: courses.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: courses,
    });
  } catch (err) {
    return handleError(res, err, "getAllCourses");
  }
};

// 🟣 Lấy chi tiết 1 khóa học
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate(
      "managers",
      "username email fullName role"
    );
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy khóa học" });
    }

    // Manager chỉ xem được khóa mình quản lý
    if (req.user?.role === "manager") {
      const managerId = req.user._id.toString();
      const isManager = course.managers.some(
        (m) => m._id?.toString() === managerId || m.toString() === managerId
      );
      if (!isManager) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền truy cập khóa học này",
        });
      }
    }

    // Student chỉ xem khóa Active
    if (req.user?.role === "student" && course.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Bạn chỉ có thể xem các khóa học đang hoạt động",
      });
    }

    res.status(200).json({ success: true, data: course });
  } catch (err) {
    return handleError(res, err, "getCourseById");
  }
};

// 🟠 Cập nhật khóa học
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy khóa học" });
    }

    const managerId = req.user._id.toString();
    const isManager = course.managers.some(
      (m) => m.toString() === managerId || m._id?.toString() === managerId
    );

    if (req.user?.role === "manager" && !isManager) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật khóa học này",
      });
    }

    const {
      title,
      name,
      expertise,
      description,
      duration,
      level,
      status,
      managers,
    } = req.body;

    if (name && name !== course.name) {
      const exists = await Course.findOne({ name });
      if (exists) {
        return res
          .status(400)
          .json({ success: false, message: "Mã khóa học đã tồn tại" });
      }
    }

    let managerIds = null;
    if (managers !== undefined) {
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Chỉ admin mới được gán managers cho khóa học",
        });
      }
      managerIds = await validateManagers(sanitizeIdList(managers));
    }

    // Apply updates
    if (title !== undefined) course.title = title;
    if (name !== undefined) course.name = name;
    if (expertise !== undefined) course.expertise = expertise;
    if (description !== undefined) course.description = description;
    if (duration !== undefined) course.duration = duration;
    if (level !== undefined) course.level = level;
    if (status !== undefined) course.status = status;
    if (managerIds !== null) course.managers = managerIds;

    await course.save();
    await course.populate("managers", "username email fullName role");

    res.status(200).json({
      success: true,
      message: "Cập nhật khóa học thành công",
      data: course,
    });
  } catch (err) {
    return handleError(res, err, "updateCourse");
  }
};

// 🔴 Xóa khóa học
exports.deleteCourse = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Chỉ admin mới được xóa khóa học" });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy khóa học" });
    }

    await course.deleteOne();
    res.status(200).json({ success: true, message: "Xóa khóa học thành công" });
  } catch (err) {
    return handleError(res, err, "deleteCourse");
  }
};
