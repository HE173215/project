# Project2 - Hệ Thống Quản Lý Giáo Dục Đầy Đủ

Một ứng dụng web toàn diện xây dựng bằng **React** (Frontend) và **Express.js** (Backend) với **MongoDB** làm cơ sở dữ liệu, cung cấp các tính năng xác thực nâng cao, quản lý khóa học, lịch biểu AI, và quản lý nhân sự giáo dục.

---

## 📋 Mục Lục

- [Tính Năng Chính](#tính-năng-chính)
- [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [Cài Đặt](#cài-đặt)
- [Sử Dụng](#sử-dụng)
- [API Endpoints](#api-endpoints)
- [Quản Lý Người Dùng](#quản-lý-người-dùng)
- [Tính Năng Bảo Mật](#tính-năng-bảo-mật)
- [Đóng Góp](#đóng-góp)

---

## ✨ Tính Năng Chính

### 🔐 Hệ Thống Xác Thực
- **Đăng Ký Người Dùng**: Xác minh email bằng mã OTP (6 chữ số, hết hạn sau 10 phút)
- **Đăng Nhập**: Email/mật khẩu với token JWT lưu trữ trong HTTP-only cookies
- **Google OAuth 2.0**: Đăng nhập nhanh chóng bằng tài khoản Google
- **Quên Mật Khẩu**: Đặt lại mật khẩu thông qua email xác minh
- **Tự Động Tạo Hồ Sơ**: Tự động tạo hồ sơ giáo viên cho người dùng vai trò giảng viên

### 📚 Quản Lý Khóa Học & Lớp Học
- Tạo và quản lý khóa học
- Quản lý lớp học liên kết với khóa học
- Quản lý sức chứa lớp học
- Gán giảng viên vào lớp

### 📅 Lịch Biểu Thông Minh (AI-Powered)
- **Tự Động Tạo Lịch**: Sử dụng TensorFlow.js để tạo lịch biểu tối ưu
- **Xem Xét Thông Tin Giáo Viên**: Cân nhắc trình độ và chuyên môn của giáo viên
- **Quản Lý Phòng Học**: Phân bổ phòng và ngăn chặn xung đột lịch
- **Hệ Thống Điểm Số**: Weighted scoring (Chuyên môn giáo viên: 55%, Yêu cầu khóa học: 25%, Sẵn có: 15%, Tối ưu hóa phòng: 5%)

### 👥 Quản Lý Nhân Sự
- Thông tin chi tiết về giáo viên/giảng viên
- Phân loại trình độ (Cơ bản, Trung bình, Nâng cao, Chuyên gia)
- Theo dõi hiệu suất giáo viên

### 📊 Quản Lý Đăng Ký & Điểm Số
- Đăng ký học sinh vào lớp học
- Quản lý điểm số và hiệu suất học tập
- Theo dõi trạng thái đăng ký

### 📧 Thông Báo
- Thông báo email tự động (Nodemailer)
- Thông báo trong ứng dụng
- Thông báo khi có sự kiện (đăng ký, thay đổi lịch biểu)

### ⚙️ Quản Lý Hệ Thống (Dành cho Quản Trị Viên)
- Quản lý người dùng (kích hoạt, khóa tài khoản)
- Xem báo cáo hiệu suất
- Quản lý tất cả các tài nguyên giáo dục

---

## 🛠️ Công Nghệ Sử Dụng

### Backend
| Công Nghệ | Phiên Bản | Mục Đích |
|-----------|----------|---------|
| **Express.js** | 5.1.0 | Web framework |
| **MongoDB** + **Mongoose** | 8.19.1 | Cơ sở dữ liệu |
| **JWT** | 9.0.2 | Xác thực token |
| **bcryptjs** | 3.0.2 | Hash mật khẩu |
| **Passport.js** | 0.7.0 | OAuth Google |
| **Nodemailer** | 6.9.7 | Gửi email |
| **TensorFlow.js** | 4.22.0 | AI lịch biểu |
| **BullMQ** | 5.61.0 | Hàng đợi tác vụ |
| **Helmet** | 8.1.0 | Bảo mật HTTP headers |
| **CORS** | 2.8.5 | Quản lý CORS |
| **Rate Limiting** | 8.1.0 | Giới hạn tần suất |

### Frontend
| Công Nghệ | Phiên Bản | Mục Đích |
|-----------|----------|---------|
| **React** | 18.2.0 | UI framework |
| **React Router** | 6.20.0 | Routing |
| **Ant Design** | 5.12.0 | UI components |
| **Axios** | 1.6.2 | HTTP client |
| **React Google OAuth** | 0.12.1 | Google login |
| **Moment.js** | 2.30.1 | Quản lý ngày giờ |

---

## 📁 Cấu Trúc Dự Án

```
project2/
├── server/
│   ├── config/                 # Cấu hình Passport.js
│   ├── controllers/            # Logic kinh doanh (11 files)
│   ├── models/                 # Mongoose schemas (9 files)
│   ├── routes/                 # API endpoints (11 files)
│   ├── middlewares/            # Middleware (xác thực, bảo mật)
│   ├── services/               # Dịch vụ tiện ích
│   │   ├── emailService.js     # Nodemailer config
│   │   ├── aiAutomationService.js # AI scheduling
│   │   └── taskQueue.js        # BullMQ queue
│   ├── .env                    # Biến môi trường
│   ├── index.js                # Express app chính
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── auth/           # OAuth components
│   │   │   ├── common/         # Reusable components
│   │   │   ├── layout/         # Layout components
│   │   │   └── routes/         # Route guards
│   │   │
│   │   ├── context/            # React Context (state management)
│   │   ├── pages/              # Page components (organized by feature)
│   │   ├── routes/             # Routing config
│   │   ├── styles/             # CSS files
│   │   ├── utils/              # Utility functions
│   │   ├── App.js              # Root component
│   │   └── index.js            # Entry point
│   │
│   └── package.json
│
├── README.md                   # This file
├── package.json                # Root package.json
└── node_modules

```

---

## 🚀 Cài Đặt

### Yêu Cầu
- Node.js v16+ và npm
- MongoDB (Atlas hoặc local)
- Tài khoản Google OAuth 2.0

### Bước 1: Clone Repository
```bash
git clone https://github.com/your-repo/project2.git
cd project2
```

### Bước 2: Cài Đặt Dependencies
```bash
# Cài đặt tất cả dependencies
npm run install-all

# Hoặc cài đặt riêng lẻ
npm run install-server
npm run install-client
```

### Bước 3: Cấu Hình Biến Môi Trường

#### Server - `server/.env`
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
PORT=5000

# JWT & Security
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Email (Gmail SMTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# CORS
CORS_ORIGIN=http://localhost:3000

# AI/ML (Optional)
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key

# Redis (For BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### Client - `client/.env`
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

### Bước 4: Khởi Động Ứng Dụng (Local)

```bash
# Khởi động cả server và client (concurrent)
npm run dev

# Hoặc khởi động riêng lẻ
npm run server      # Server chạy ở port 5000
npm run client      # Client chạy ở port 3000
```

---

## 🐳 Cài Đặt với Docker

### Yêu Cầu
- Docker v20.10+
- Docker Compose v2.0+

### Bước 1: Tạo File .env

```bash
# Copy file example và chỉnh sửa thông tin
cp .env.example .env
```

Các biến môi trường quan trọng:
```env
# Database
MONGO_ROOT_USERNAME=root
MONGO_ROOT_PASSWORD=rootpassword
MONGO_DB_NAME=project2

# Redis
REDIS_PASSWORD=redispassword

# JWT & Security
JWT_SECRET=your_super_secret_key_here_min_32_chars

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# API Endpoints
REACT_APP_API_URL=http://localhost:5000/api
CORS_ORIGIN=http://localhost:3000
```

### Bước 2: Khởi Động với Docker Compose

#### Production Environment
```bash
# Khởi động toàn bộ ứng dụng (MongoDB, Redis, Server, Client)
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng ứng dụng
docker-compose down

# Xóa tất cả volumes (database, cache)
docker-compose down -v
```

#### Development Environment (Hot Reload)
```bash
# Khởi động với hot reload
docker-compose -f docker-compose.dev.yml up

# Chạy ở background
docker-compose -f docker-compose.dev.yml up -d

# Xem logs real-time
docker-compose -f docker-compose.dev.yml logs -f

# Chỉ xem logs của service cụ thể
docker-compose -f docker-compose.dev.yml logs -f server
docker-compose -f docker-compose.dev.yml logs -f client
```

### Bước 3: Truy Cập Ứng Dụng

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **MongoDB**: localhost:27017 (với credentials từ .env)
- **Redis**: localhost:6379

### Các Lệnh Docker Hữu Ích

```bash
# Kiểm tra status các container
docker-compose ps

# Xem logs của service cụ thể
docker-compose logs server
docker-compose logs client
docker-compose logs mongodb

# Truy cập MongoDB shell
docker-compose exec mongodb mongosh -u root -p rootpassword

# Truy cập Redis CLI
docker-compose exec redis redis-cli -a redispassword

# Rebuild các images
docker-compose build --no-cache

# Stop tất cả containers
docker-compose stop

# Khởi động lại containers
docker-compose restart

# Xóa containers và images
docker-compose down --rmi all
```

### Build Custom Images

```bash
# Build production images
docker build -t project2-server:latest ./server
docker build -t project2-client:latest ./client

# Build development images
docker build -f ./server/Dockerfile.dev -t project2-server:dev ./server
docker build -f ./client/Dockerfile.dev -t project2-client:dev ./client
```

### Troubleshooting

#### Container không khởi động
```bash
# Kiểm tra logs chi tiết
docker-compose logs server
docker-compose logs client

# Rebuild images
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### Lỗi kết nối MongoDB
```bash
# Kiểm tra health của MongoDB
docker-compose ps mongodb

# Xem logs MongoDB
docker-compose logs mongodb

# Reset MongoDB volumes
docker-compose down -v
docker-compose up -d
```

#### Port bị chiếm
```bash
# Kiểm tra port đang sử dụng
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # macOS/Linux

# Thay đổi port trong docker-compose.yml hoặc .env
SERVER_PORT=5001
CLIENT_PORT=3001
```

### Health Checks

Mỗi service đều có health check tích hợp:

```bash
# Kiểm tra health status
docker-compose ps

# Ví dụ output:
# NAME              STATUS
# project2-server   Up 2 minutes (healthy)
# project2-client   Up 2 minutes (healthy)
# project2-mongodb  Up 2 minutes (healthy)
# project2-redis    Up 2 minutes (healthy)
```

---

## 📖 Sử Dụng

### Quy Trình Đăng Ký
1. Nhấp vào "Đăng Ký" trên trang đăng nhập
2. Nhập email, tên người dùng, mật khẩu
3. Hệ thống sẽ gửi mã OTP 6 chữ số đến email
4. Nhập mã OTP để xác minh (hết hạn sau 10 phút)
5. Tài khoản kích hoạt, có thể đăng nhập ngay

### Quy Trình Đăng Nhập
1. **Email/Mật khẩu**: Nhập thông tin đăng nhập
2. **Google OAuth**: Hoặc click "Đăng Nhập Bằng Google"
3. Token JWT được lưu trong HTTP-only cookie
4. Chuyển hướng đến dashboard theo vai trò

### Dashboard Theo Vai Trò
- **Sinh Viên**: Xem lớp học đã đăng ký, điểm số, lịch biểu
- **Giáo Viên**: Quản lý lớp học, điểm số, xem lịch biểu
- **Quản Lý**: Xem báo cáo hiệu suất, thống kê
- **Quản Trị Viên**: Quản lý tất cả người dùng, tài nguyên, cấu hình hệ thống

---

## 🔗 API Endpoints

### Xác Thực (Rate Limited)
```
POST   /api/auth/register              # Đăng ký người dùng
POST   /api/auth/login                 # Đăng nhập
POST   /api/auth/verify-otp            # Xác minh OTP
POST   /api/auth/resend-otp            # Gửi lại OTP
POST   /api/auth/forgot-password       # Yêu cầu đặt lại mật khẩu
POST   /api/auth/reset-password        # Đặt lại mật khẩu
GET    /api/auth/me                    # Lấy thông tin người dùng hiện tại
POST   /api/auth/logout                # Đăng xuất

GET    /api/auth/google                # Khởi tạo OAuth Google
GET    /api/auth/google/callback       # Callback Google OAuth
```

### Quản Lý Khóa Học
```
GET    /api/courses                    # Lấy danh sách khóa học
POST   /api/courses                    # Tạo khóa học mới
GET    /api/courses/:id                # Lấy chi tiết khóa học
PUT    /api/courses/:id                # Cập nhật khóa học
DELETE /api/courses/:id                # Xóa khóa học
```

### Quản Lý Lớp Học
```
GET    /api/classes                    # Lấy danh sách lớp học
POST   /api/classes                    # Tạo lớp học mới
GET    /api/classes/:id                # Lấy chi tiết lớp học
PUT    /api/classes/:id                # Cập nhật lớp học
DELETE /api/classes/:id                # Xóa lớp học
```

### Đăng Ký & Điểm Số
```
GET    /api/enrollments                # Lấy danh sách đăng ký
POST   /api/enrollments                # Tạo đăng ký mới
GET    /api/enrollments/:id            # Lấy chi tiết đăng ký
PUT    /api/enrollments/:id            # Cập nhật điểm số
DELETE /api/enrollments/:id            # Xóa đăng ký
```

### Lịch Biểu
```
GET    /api/schedules                  # Lấy danh sách lịch biểu
POST   /api/schedules                  # Tạo lịch biểu mới
POST   /api/schedules/ai-generate      # Tạo lịch tự động (AI)
GET    /api/schedules/:id              # Lấy chi tiết lịch biểu
PUT    /api/schedules/:id              # Cập nhật lịch biểu
DELETE /api/schedules/:id              # Xóa lịch biểu
```

### Phòng Học
```
GET    /api/rooms                      # Lấy danh sách phòng
POST   /api/rooms                      # Tạo phòng mới
GET    /api/rooms/:id                  # Lấy chi tiết phòng
PUT    /api/rooms/:id                  # Cập nhật phòng
DELETE /api/rooms/:id                  # Xóa phòng
```

### Giáo Viên
```
GET    /api/teachers                   # Lấy danh sách giáo viên
POST   /api/teachers                   # Tạo hồ sơ giáo viên
GET    /api/teachers/:id               # Lấy chi tiết giáo viên
PUT    /api/teachers/:id               # Cập nhật thông tin giáo viên
```

### Người Dùng
```
GET    /api/users                      # Lấy danh sách người dùng (Admin)
GET    /api/users/:id                  # Lấy chi tiết người dùng
PUT    /api/users/:id                  # Cập nhật người dùng
PUT    /api/users/:id/block            # Khóa tài khoản người dùng
PUT    /api/users/:id/unblock          # Mở khóa tài khoản người dùng
```

### Thông Báo
```
GET    /api/notifications              # Lấy thông báo của người dùng
PUT    /api/notifications/:id/read     # Đánh dấu đã đọc
DELETE /api/notifications/:id          # Xóa thông báo
```

---

## 👥 Quản Lý Người Dùng

### Vai Trò & Quyền Hạn

| Vai Trò | Quyền |
|---------|-------|
| **Admin** | Quản lý tất cả người dùng, lớp học, khóa học, cấu hình hệ thống |
| **Lecturer** | Tạo/quản lý lớp học, nhập điểm, xem lịch biểu |
| **Student** | Đăng ký lớp học, xem điểm, xem thông báo |
| **Manager** | Xem báo cáo hiệu suất, thống kê |

### Trạng Thái Tài Khoản
- **Active**: Tài khoản hoạt động bình thường
- **Blocked**: Tài khoản bị khóa (không thể đăng nhập)
- **Verified**: Email đã được xác minh

---

## 🔒 Tính Năng Bảo Mật

1. **JWT Authentication**: Token JWT lưu trữ trong HTTP-only cookies
2. **Password Hashing**: bcryptjs với 10 rounds
3. **Email Verification**: OTP 6 chữ số có thời gian hết hạn
4. **Rate Limiting**: Giới hạn tần suất yêu cầu API
5. **CORS Protection**: Cấu hình nguồn gốc được phép
6. **Security Headers**: Helmet.js bảo vệ HTTP headers
7. **Account Locking**: Khóa tài khoản khi cần
8. **Password Reset**: Xác minh email trước khi đặt lại
9. **Role-Based Access Control**: Kiểm tra quyền hạn ở mỗi endpoint
10. **Input Validation**: Xác thực dữ liệu ở mức model

---

## 🤖 Tính Năng AI

### AI Schedule Generation (TensorFlow.js)
- Tự động tạo lịch biểu tối ưu
- Xem xét:
  - Trình độ giáo viên (55% trọng số)
  - Yêu cầu khóa học (25% trọng số)
  - Sẵn có của giáo viên (15% trọng số)
  - Tối ưu hóa phòng học (5% trọng số)
- Ngăn chặn xung đột lịch
- Tự động phân bổ phòng học phù hợp

---

## 📊 Mô Hình Dữ Liệu

### User (Người Dùng)
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  role: String (admin, lecturer, student, manager),
  fullName: String,
  phone: String,
  avatar: String (URL),
  otp: String,
  otpExpire: Date,
  passwordResetToken: String,
  passwordResetExpire: Date,
  isVerified: Boolean,
  isActive: Boolean,
  isBlocked: Boolean,
  lastLogin: Date,
  googleId: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Course (Khóa Học)
```javascript
{
  title: String,
  description: String,
  level: String (beginner, intermediate, advanced),
  teacher: ObjectId (ref: Teacher),
  prerequisites: [String],
  capacity: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Class (Lớp Học)
```javascript
{
  name: String,
  course: ObjectId (ref: Course),
  teacher: ObjectId (ref: Teacher),
  capacity: Number,
  startDate: Date,
  endDate: Date,
  status: String (active, inactive, completed),
  createdAt: Date,
  updatedAt: Date
}
```

### Enrollment (Đăng Ký)
```javascript
{
  student: ObjectId (ref: User),
  class: ObjectId (ref: Class),
  enrollmentDate: Date,
  grade: Number,
  status: String (active, dropped, completed),
  createdAt: Date,
  updatedAt: Date
}
```

### Schedule (Lịch Biểu)
```javascript
{
  class: ObjectId (ref: Class),
  room: ObjectId (ref: Room),
  dayOfWeek: String (Mon, Tue, Wed, ...),
  startTime: String (HH:mm),
  endTime: String (HH:mm),
  recurrence: String (weekly, daily),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 📝 Ghi Chú Phát Triển

### Commit Gần Đây
- `4ef2b93` - Chinh UI/UX và AI
- `9525f27` - Fix axios
- `1eda072` - Fix schedule
- `3469042` - Fix CORS 2
- `c0cb276` - Fix CORS

### Để Phát Triển Tiếp Theo
- [ ] Implement real-time notifications (Socket.io)
- [ ] Thêm dashboard thống kê chi tiết
- [ ] Optimize AI scheduling algorithm
- [ ] Mobile app (React Native)
- [ ] Caching layer (Redis optimization)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Unit & Integration tests
- [ ] CI/CD pipeline

---

## 🤝 Đóng Góp

Để đóng góp vào dự án:

1. Fork repository
2. Tạo branch tính năng (`git checkout -b feature/amazing-feature`)
3. Commit thay đổi (`git commit -m 'Add amazing feature'`)
4. Push đến branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

---

## 📄 Giấy Phép

Dự án này được cấp phép dưới **ISC License**.

---

## 📧 Liên Hệ & Hỗ Trợ

Nếu bạn gặp vấn đề hoặc có câu hỏi, vui lòng:
- Tạo Issue trên GitHub
- Gửi email cho nhóm phát triển

---

## 🙏 Cảm Ơn

Cảm ơn tất cả những người đã đóng góp vào dự án này!