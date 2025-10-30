const tf = require("@tensorflow/tfjs");
const moment = require("moment");

const Enrollment = require("../models/Enrollment");
const Class = require("../models/Class");
const Schedule = require("../models/Schedule");
const Room = require("../models/Room");
const Notification = require("../models/Notification");

// =======================
// 🔹 Cấu hình AI xếp lớp
// =======================
const LEVEL_PRIORITY = { Junior: 1, "Mid-level": 2, Senior: 3, Expert: 4 };
const COURSE_REQUIREMENT = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4,
};
const MAX_LEVEL_SCORE = Math.max(...Object.values(LEVEL_PRIORITY)) || 1;
const MAX_DAYS_WINDOW = 120;
const AI_DEFAULT_CONFIDENCE = 0.55;

const MODEL_WEIGHTS = tf.tensor2d([[0.55], [0.25], [0.15], [0.05]]);
const MODEL_BIAS = tf.scalar(0.1);

const tidyPredict = (featureVector) =>
  tf.tidy(() => {
    const input = tf.tensor2d([featureVector]);
    const logits = input.matMul(MODEL_WEIGHTS).add(MODEL_BIAS);
    const probability = logits.sigmoid();
    return probability.dataSync()[0];
  });

const daysUntil = (date) => {
  if (!date) return null;
  const start = new Date(date).getTime();
  if (Number.isNaN(start)) return null;
  const now = Date.now();
  return Math.max(0, Math.round((start - now) / (1000 * 60 * 60 * 24)));
};

// ==================================================
// 🔹 AI sinh lịch học tự động cho lớp
// ==================================================
exports.autoGenerateScheduleForClass = async (classId) => {
  try {
    const classDoc = await Class.findById(classId)
      .populate({
        path: "teacher",
        select: "name level user",
        populate: { path: "user", select: "fullName email" },
      })
      .populate("course")
      .populate("room");

    if (!classDoc) throw new Error("Không tìm thấy lớp");
    if (!classDoc.teacher) throw new Error("Lớp chưa có giảng viên");
    if (!classDoc.course) throw new Error("Lớp chưa gắn khóa học");
    if (
      !Array.isArray(classDoc.teachingDays) ||
      classDoc.teachingDays.length === 0
    )
      throw new Error("Lớp chưa chọn ngày giảng dạy");

    // ✅ chỉ lấy teachingDays từ Class
    const teachingDays = classDoc.teachingDays;

    const totalHours = classDoc.course.duration || 0;
    const hoursPerSession = 2;
    const totalSessions = Math.ceil(totalHours / hoursPerSession);
    if (totalSessions <= 0)
      return {
        success: true,
        message: "Khóa học không yêu cầu buổi học",
        data: { classId, sessions: [], completionRate: 100 },
      };

    const timeSlots = [
      { start: "07:30", end: "09:30" },
      { start: "09:45", end: "11:45" },
      { start: "13:00", end: "15:00" },
      { start: "15:15", end: "17:15" },
    ];

    const startDate = moment(classDoc.startDate);
    const endDate = moment(classDoc.endDate);
    const preferBuilding = classDoc.room?.building || null;
    const preferFloor = classDoc.room?.floor || null;
    const minCapacity = classDoc.maxStudents || 20;

    let created = 0;
    const createdSessions = [];
    const classSessionsPerDay = {}; // đếm số slot mỗi ngày

    // ===== Helper: tìm phòng khả dụng, ưu tiên gần nhau =====
    const findAvailableRoom = async (teacherId, date, start, end) => {
      const rooms = await Room.find({
        status: "Available",
        capacity: { $gte: minCapacity },
      });

      const sameDaySchedules = await Schedule.find({
        teacher: teacherId,
        date: moment(date).startOf("day").toDate(),
      }).populate("room");

      const usedRooms = sameDaySchedules.map((s) => s.room).filter(Boolean);

      for (const room of rooms) {
        if (await Schedule.checkRoomConflict(room._id, date, start, end))
          continue;
        const sameBuilding = usedRooms.some(
          (r) => r?.building && r.building === room.building
        );
        const sameFloor = usedRooms.some(
          (r) => r?.floor && r.floor === room.floor
        );
        if (sameBuilding || sameFloor) return room;
      }

      for (const room of rooms) {
        if (await Schedule.checkRoomConflict(room._id, date, start, end))
          continue;
        if (
          (preferBuilding && room.building === preferBuilding) ||
          (preferFloor && room.floor === preferFloor)
        )
          return room;
      }

      for (const room of rooms) {
        if (!(await Schedule.checkRoomConflict(room._id, date, start, end)))
          return room;
      }

      return null;
    };

    // ===== Vòng lặp chính: tạo buổi học =====
    for (
      let d = moment(startDate);
      d.isSameOrBefore(endDate) && created < totalSessions;
      d.add(1, "days")
    ) {
      const weekday = d.format("dddd").toLowerCase();
      if (!teachingDays.includes(weekday)) continue;

      const dayKey = d.format("YYYY-MM-DD");
      classSessionsPerDay[dayKey] = classSessionsPerDay[dayKey] || 0;
      if (classSessionsPerDay[dayKey] >= 2) continue; // tối đa 2 buổi/ngày/lớp

      for (const slot of timeSlots) {
        if (created >= totalSessions) break;
        if (classSessionsPerDay[dayKey] >= 2) break;

        const date = d.toDate();
        const { start, end } = slot;

        const teacherConflict = await Schedule.checkTeacherConflict(
          classDoc.teacher._id,
          date,
          start,
          end
        );
        if (teacherConflict) continue;

        const room = await findAvailableRoom(
          classDoc.teacher._id,
          date,
          start,
          end
        );
        if (!room) continue;

        await Schedule.create({
          class: classDoc._id,
          teacher: classDoc.teacher._id,
          date,
          startTime: start,
          endTime: end,
          room: room._id,
          topic: `Buổi ${created + 1}`,
        });

        created++;
        classSessionsPerDay[dayKey]++;
        createdSessions.push({
          date: moment(date).format("DD/MM/YYYY"),
          start,
          end,
          room: room.name,
        });
      }
    }

    const completionRate = Math.round((created / totalSessions) * 100);

    await Notification.create({
      user: classDoc.teacher.user,
      title: "Tự động xếp lịch giảng dạy",
      message: `Hệ thống đã tạo ${created}/${totalSessions} buổi học cho lớp "${classDoc.title}" (${completionRate}% hoàn thành, tối đa 2 buổi/ngày).`,
      type: "Info",
      relatedModel: "Class",
      relatedId: classDoc._id,
    });

    return {
      success: true,
      message: `AI đã tạo ${created}/${totalSessions} buổi học (${completionRate}% hoàn thành, tối đa 2 buổi/ngày).`,
      data: { classId, sessions: createdSessions, completionRate },
    };
  } catch (err) {
    console.error("❌ AI Auto Schedule Error:", err);
    return { success: false, message: err.message };
  }
};
/**
 * Giả lập AI chọn lớp phù hợp
 */
const requestAssignment = async ({ enrollmentId, allowedStatuses }) => {
  const enrollment = await Enrollment.findById(enrollmentId)
    .populate('course')
    .populate('user');

  if (!enrollment)
    return { success: false, message: 'Không tìm thấy enrollment' };

  if (!allowedStatuses.includes(enrollment.status))
    return { success: false, message: 'Enrollment chưa đủ điều kiện gán lớp' };

  const availableClass = await Class.findOne({
    course: enrollment.course._id,
    status: 'Active',
    $expr: { $lt: ['$currentStudents', '$maxStudents'] }
  });

  if (!availableClass)
    return { success: false, message: 'Không có lớp khả dụng' };

  return {
    success: true,
    data: {
      suggestedClassId: availableClass._id,
      confidence: 0.9,
      reasoning: 'Chọn lớp còn chỗ trống cùng khóa học.'
    },
    message: 'AI đề xuất lớp phù hợp.'
  };
};

/**
 * Gán lớp cho enrollment
 */
const applyAssignment = async ({ enrollmentId, classId }) => {
  const enrollment = await Enrollment.findById(enrollmentId).populate('user');
  const classDoc = await Class.findById(classId);

  if (!enrollment || !classDoc)
    throw new Error('Không tìm thấy dữ liệu hợp lệ');

  classDoc.students.addToSet(enrollment.user._id);
  classDoc.currentStudents += 1;
  await classDoc.save();

  enrollment.class = classId;
  enrollment.status = 'Approved';
  enrollment.approvalDate = new Date();
  await enrollment.save();

  return enrollment;
};

/**
 * Kiểm tra độ tin cậy AI
 */
const shouldUseAIResult = (data) => {
  if (!data?.suggestedClassId) return false;
  return data.confidence >= 0.6;
};

module.exports = {
  requestAssignment,
  applyAssignment,
  shouldUseAIResult
};