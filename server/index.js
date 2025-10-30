require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const passport = require("./config/passport");
const {
  corsOptions,
  helmetOptions,
  apiLimiter,
} = require("./middlewares/securityMiddleware");

const app = express();

// ===== Trust Proxy (FIX LỖI RENDER) =====
app.set("trust proxy", 1);

// ===== Environment =====
const { PORT = 5000, MONGO_URI, NODE_ENV } = process.env;
const isDev = NODE_ENV === "development";

// ===== Security Middlewares =====
app.use(helmet(helmetOptions));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ===== Rate Limiting =====
const RATE_LIMIT_SKIP_PATHS = new Set([
  "/auth/me",
  "/auth/logout",
  "/auth/login",
  "/auth/register",
  "/auth/verify-otp",
  "/auth/resend-otp",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/google",
  "/auth/google/callback",
  "/users/create",
  "/users",
]);

app.use("/api", (req, res, next) => {
  const skip =
    RATE_LIMIT_SKIP_PATHS.has(req.path) ||
    [...RATE_LIMIT_SKIP_PATHS].some((p) => req.path.startsWith(`${p}/`));

  if (skip) return next();
  return apiLimiter(req, res, next);
});

// ===== Passport =====
app.use(passport.initialize());

// ===== MongoDB Connection =====
if (!MONGO_URI) {
  console.error("❌ Thiếu MONGO_URI trong file .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Đã kết nối MongoDB"))
  .catch((err) => {
    console.error("❌ Lỗi kết nối MongoDB:", err.message);
    process.exit(1);
  });

// ===== Routes =====
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const googleAuthRoutes = require("./routes/googleAuthRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const courseRoutes = require("./routes/courseRoutes");
const roomRoutes = require("./routes/roomRoutes");
const classRoutes = require("./routes/classRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const routes = [
  ["/api/auth", authRoutes],
  ["/api/auth", googleAuthRoutes],
  ["/api/users", userRoutes],
  ["/api/teachers", teacherRoutes],
  ["/api/courses", courseRoutes],
  ["/api/rooms", roomRoutes],
  ["/api/classes", classRoutes],
  ["/api/schedules", scheduleRoutes],
  ["/api/enrollments", enrollmentRoutes],
  ["/api/assessments", assessmentRoutes],
  ["/api/notifications", notificationRoutes],
];

routes.forEach(([path, handler]) => app.use(path, handler));

// ===== 404 Handler =====
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route không tồn tại" });
});

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (isDev) console.error("❌ Error:", err);

  res.status(status).json({
    success: false,
    message: err.message || "Lỗi server",
    ...(isDev ? { stack: err.stack } : {}),
  });
});

// ===== Server Start =====
app.listen(PORT, () => {
  console.log(
    `🚀 Server đang chạy: http://localhost:${PORT} [${
      NODE_ENV || "production"
    }]`
  );
});
