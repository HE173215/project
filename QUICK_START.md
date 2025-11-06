# ⚡ Quick Start Guide

Hướng dẫn nhanh để chạy dự án trong 5 phút!

## 🚀 Bước 1: Cài đặt Dependencies

Mở terminal tại thư mục `project2` và chạy:

```bash
npm install
npm run install-all
```

Lệnh này sẽ:
- Cài đặt concurrently để chạy cả frontend và backend
- Cài đặt tất cả dependencies cho server
- Cài đặt tất cả dependencies cho client

## 🔥 Bước 2: Chạy ứng dụng

```bash
npm run dev
```

Lệnh này sẽ tự động:
- Khởi động Backend server tại `http://localhost:5000`
- Khởi động Frontend React app tại `http://localhost:3000`
- Tự động mở browser

## ✅ Bước 3: Test ứng dụng

### Đăng ký tài khoản mới

1. Truy cập: http://localhost:3000/register
2. Điền thông tin:
   - Username: `testuser`
   - Email: `test@gmail.com`
   - Password: `123456`
   - Full Name: `Test User`
   - Phone: `0123456789`
3. Click **"Đăng ký"**

### Lấy OTP

Sau khi đăng ký, check terminal đang chạy backend (server), bạn sẽ thấy:

```
📧 OTP đã gửi đến test@gmail.com: 123456
```

Copy mã OTP này (6 số)

### Xác thực OTP

1. Trang sẽ tự động chuyển đến `/verify-otp`
2. Nhập mã OTP vừa copy
3. Click **"Xác thực"**
4. Tự động redirect đến Dashboard

### Đăng nhập

1. Truy cập: http://localhost:3000/login
2. Nhập:
   - Email: `test@gmail.com`
   - Password: `123456`
3. Click **"Đăng nhập"**

## 🎉 Xong!

Bạn đã hoàn thành setup và có thể sử dụng ứng dụng!

---

## 📝 Lưu ý

### OTP trong Development Mode

- OTP sẽ hiển thị trong console của server
- Trong production, OTP sẽ được gửi qua email

### Email Service

- Email service đã được cấu hình sẵn
- Nếu muốn test gửi email thật, xem `server/EMAIL_SETUP_GUIDE.md`

### Ports

- **Backend:** Port 5000
- **Frontend:** Port 3000

Nếu port bị trùng, đổi trong:
- Backend: `server/.env` → `PORT=5001`
- Frontend: Tự động chọn port khác

---

## 🐛 Gặp lỗi?

### Backend không chạy

```bash
cd server
npm install
npm run server
```

### Frontend không chạy

```bash
cd client
npm install
npm start
```

### MongoDB connection error

- Kiểm tra internet connection
- MongoDB URI trong `.env` đã được cấu hình sẵn và hoạt động

### Port already in use

**Windows:**
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -ti:5000 | xargs kill -9
```

---

## 📚 Tài liệu đầy đủ

- **Setup chi tiết:** `SETUP_GUIDE.md`
- **README:** `README.md`
- **API Documentation:** `server/API_DOCUMENTATION.md`

---

## 🎯 Các tính năng để test

- ✅ Đăng ký
- ✅ Xác thực OTP
- ✅ Gửi lại OTP
- ✅ Đăng nhập
- ✅ Dashboard
- ✅ Profile (cập nhật thông tin)
- ✅ Quên mật khẩu
- ✅ Reset password
- ✅ Đăng xuất

---

**Chúc bạn code vui vẻ! 🚀**
