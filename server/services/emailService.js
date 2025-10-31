const nodemailer = require('nodemailer')

// Cấu hình transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  })
}

// Template email chung
const emailTemplate = (title, content, buttonText, buttonLink) => {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f7fa;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 20px;
          text-align: center;
          color: white;
        }
        .header h1 {
          font-size: 28px;
          margin-bottom: 10px;
        }
        .content {
          padding: 40px 30px;
          color: #333333;
          line-height: 1.6;
        }
        .content h2 {
          color: #667eea;
          margin-bottom: 20px;
          font-size: 24px;
        }
        .content p {
          margin-bottom: 15px;
          font-size: 16px;
        }
        .otp-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin: 30px 0;
        }
        .otp-code {
          font-size: 36px;
          font-weight: bold;
          letter-spacing: 8px;
          margin: 10px 0;
        }
        .button {
          display: inline-block;
          padding: 14px 35px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          margin: 20px 0;
          font-weight: 600;
          transition: transform 0.2s;
        }
        .button:hover {
          transform: translateY(-2px);
        }
        .info-box {
          background-color: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 30px;
          text-align: center;
          color: #666666;
          font-size: 14px;
        }
        .footer p {
          margin-bottom: 10px;
        }
        .social-links {
          margin-top: 20px;
        }
        .social-links a {
          display: inline-block;
          margin: 0 10px;
          color: #667eea;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 ${process.env.APP_NAME || 'Your App'}</h1>
          <p>Hệ thống xác thực tài khoản</p>
        </div>
        <div class="content">
          ${content}
          ${buttonText && buttonLink ? `
            <div style="text-align: center;">
              <a href="${buttonLink}" class="button">${buttonText}</a>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
          <p style="margin-top: 20px;">
            <strong>${process.env.APP_NAME || 'Your App'}</strong><br>
            © ${new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Template OTP cho đăng ký
const otpRegistrationTemplate = (username, otp) => {
  const content = `
    <h2>Xin chào ${username}! 👋</h2>
    <p>Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã OTP bên dưới:</p>
    
    <div class="otp-box">
      <p style="margin: 0; font-size: 14px;">Mã OTP của bạn</p>
      <div class="otp-code">${otp}</div>
      <p style="margin: 0; font-size: 14px;">Có hiệu lực trong 10 phút</p>
    </div>
    
    <div class="info-box">
      <p><strong>⚠️ Lưu ý bảo mật:</strong></p>
      <ul style="margin-left: 20px; margin-top: 10px;">
        <li>Không chia sẻ mã OTP này với bất kỳ ai</li>
        <li>Mã OTP chỉ có hiệu lực trong 10 phút</li>
        <li>Nếu không phải bạn thực hiện, vui lòng bỏ qua email này</li>
      </ul>
    </div>
  `
  
  return emailTemplate('Xác thực tài khoản', content)
}

// Template OTP cho reset password
const otpResetPasswordTemplate = (username, otp) => {
  const content = `
    <h2>Xin chào ${username}! 👋</h2>
    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Sử dụng mã OTP bên dưới để tiếp tục:</p>
    
    <div class="otp-box">
      <p style="margin: 0; font-size: 14px;">Mã OTP đặt lại mật khẩu</p>
      <div class="otp-code">${otp}</div>
      <p style="margin: 0; font-size: 14px;">Có hiệu lực trong 10 phút</p>
    </div>
    
    <div class="info-box">
      <p><strong>⚠️ Cảnh báo bảo mật:</strong></p>
      <ul style="margin-left: 20px; margin-top: 10px;">
        <li>Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này</li>
        <li>Không chia sẻ mã OTP với bất kỳ ai</li>
        <li>Mã OTP sẽ hết hiệu lực sau 10 phút</li>
      </ul>
    </div>
    
    <p>Nếu bạn gặp vấn đề, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi.</p>
  `
  
  return emailTemplate('Đặt lại mật khẩu', content)
}

// Template chào mừng sau khi xác thực thành công
const welcomeTemplate = (username) => {
  const content = `
    <h2>Chào mừng ${username}! 🎉</h2>
    <p>Tài khoản của bạn đã được xác thực thành công!</p>
    
    <div class="info-box">
      <p><strong>✅ Bạn có thể bắt đầu sử dụng các tính năng:</strong></p>
      <ul style="margin-left: 20px; margin-top: 10px;">
        <li>Quản lý thông tin cá nhân</li>
        <li>Truy cập đầy đủ các dịch vụ</li>
        <li>Tương tác với cộng đồng</li>
      </ul>
    </div>
    
    <p>Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi!</p>
  `
  
  return emailTemplate('Chào mừng bạn đến với chúng tôi', content, 'Bắt đầu ngay', process.env.APP_URL || '#')
}

// Template thông báo đổi mật khẩu thành công
const passwordChangedTemplate = (username) => {
  const content = `
    <h2>Xin chào ${username}! 👋</h2>
    <p>Mật khẩu của bạn đã được thay đổi thành công.</p>
    
    <div class="info-box">
      <p><strong>📌 Thông tin:</strong></p>
      <ul style="margin-left: 20px; margin-top: 10px;">
        <li>Thời gian: ${new Date().toLocaleString('vi-VN')}</li>
        <li>Bạn có thể đăng nhập với mật khẩu mới ngay bây giờ</li>
      </ul>
    </div>
    
    <div class="info-box" style="border-left-color: #dc3545; background-color: #fff5f5;">
      <p><strong>⚠️ Nếu bạn không thực hiện thay đổi này:</strong></p>
      <p style="margin-top: 10px;">Vui lòng liên hệ ngay với bộ phận hỗ trợ để bảo vệ tài khoản của bạn.</p>
    </div>
  `
  
  return emailTemplate('Mật khẩu đã được thay đổi', content)
}

// Hàm gửi email
const sendEmail = async (to, subject, htmlContent) => {
  try {
    // Kiểm tra cấu hình email
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('❌ Thiếu cấu hình EMAIL_USER hoặc EMAIL_PASSWORD trong .env')
      return {
        success: false,
        message: 'Chưa cấu hình email service'
      }
    }

    const transporter = createTransporter()

    const mailOptions = {
      from: `"${process.env.APP_NAME || 'Your App'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent
    }

    const info = await transporter.sendMail(mailOptions)

    return {
      success: true,
      messageId: info.messageId
    }
  } catch (error) {
    console.error('❌ Lỗi gửi email:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

// Export các hàm gửi email cụ thể
module.exports = {
  // Gửi OTP đăng ký
  sendOTPRegistration: async (email, username, otp) => {
    const html = otpRegistrationTemplate(username, otp)
    return await sendEmail(email, 'Xác thực tài khoản - Mã OTP', html)
  },

  // Gửi OTP reset password
  sendOTPResetPassword: async (email, username, otp) => {
    const html = otpResetPasswordTemplate(username, otp)
    return await sendEmail(email, 'Đặt lại mật khẩu - Mã OTP', html)
  },

  // Gửi email chào mừng
  sendWelcomeEmail: async (email, username) => {
    const html = welcomeTemplate(username)
    return await sendEmail(email, 'Chào mừng bạn đến với chúng tôi! 🎉', html)
  },

  // Gửi thông báo đổi mật khẩu
  sendPasswordChangedEmail: async (email, username) => {
    const html = passwordChangedTemplate(username)
    return await sendEmail(email, 'Mật khẩu đã được thay đổi', html)
  },

  // Gửi email tùy chỉnh
  sendCustomEmail: async (email, subject, htmlContent) => {
    return await sendEmail(email, subject, htmlContent)
  }
}
