const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper: Set token cookie
const setTokenCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  }
  
  res.cookie('token', token, cookieOptions);
};

/**
 * @desc    Verify Google Token và đăng nhập/đăng ký
 * @route   POST /api/auth/google
 * @access  Public
 */
exports.googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token Google là bắt buộc'
      });
    }

    // Fetch user info from Google API using access token
    const googleUserInfo = await axios.get(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const {
      sub: googleId,
      email,
      name,
      picture,
      email_verified
    } = googleUserInfo.data;

    // Kiểm tra user đã tồn tại chưa (theo googleId)
    let user = await User.findOne({ googleId });

    if (user) {
      // User đã tồn tại, cập nhật lastLogin
      user.lastLogin = Date.now();
      await user.save();

      // Generate JWT token and set cookie
      const jwtToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      setTokenCookie(res, jwtToken);

      return res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            avatar: user.avatar,
            role: user.role,
            isVerified: user.isVerified
          }
        }
      });
    }

    // Kiểm tra email đã được dùng chưa - cần full document để update
    const existingEmailUser = await User.findOne({ email });

    if (existingEmailUser) {
      // Email đã tồn tại, link Google account
      existingEmailUser.googleId = googleId;
      existingEmailUser.avatar = picture || existingEmailUser.avatar;
      existingEmailUser.isVerified = email_verified || existingEmailUser.isVerified;
      existingEmailUser.lastLogin = Date.now();
      await existingEmailUser.save();

      // Generate JWT token and set cookie
      const jwtToken = jwt.sign(
        { id: existingEmailUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      setTokenCookie(res, jwtToken);

      return res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công và đã liên kết với Google',
        data: {
          user: {
            id: existingEmailUser._id,
            username: existingEmailUser.username,
            email: existingEmailUser.email,
            fullName: existingEmailUser.fullName,
            avatar: existingEmailUser.avatar,
            role: existingEmailUser.role,
            isVerified: existingEmailUser.isVerified
          }
        }
      });
    }

    // Tạo user mới
    const username = email.split('@')[0] + '_' + Date.now();
    const randomPassword = 'GOOGLE_AUTH_' + Math.random().toString(36).substring(2, 15);

    const newUser = await User.create({
      googleId,
      email,
      username,
      fullName: name,
      avatar: picture,
      password: randomPassword,
      isVerified: email_verified || true,
      lastLogin: Date.now()
    });

    // Generate JWT token and set cookie
    const jwtToken = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    setTokenCookie(res, jwtToken);

    res.status(201).json({
      success: true,
      message: 'Đăng ký và đăng nhập thành công với Google',
      data: {
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          fullName: newUser.fullName,
          avatar: newUser.avatar,
          role: newUser.role,
          isVerified: newUser.isVerified
        }
      }
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    
    // Handle axios errors from Google API
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Token Google không hợp lệ hoặc đã hết hạn'
      });
    }

    if (error.message.includes('Token used too late')) {
      return res.status(401).json({
        success: false,
        message: 'Token Google đã hết hạn'
      });
    }

    if (error.message.includes('Invalid token')) {
      return res.status(401).json({
        success: false,
        message: 'Token Google không hợp lệ'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác thực Google',
      error: error.message
    });
  }
};

/**
 * @desc    Google OAuth Callback (Passport strategy)
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
exports.googleCallback = async (req, res) => {
  try {
    // User đã được authenticate bởi passport
    const user = req.user;

    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/auth/login?error=google_auth_failed`);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect về frontend với token
    res.redirect(`${process.env.CLIENT_URL}/auth/google/success?token=${token}`);

  } catch (error) {
    console.error('Google Callback Error:', error);
    res.redirect(`${process.env.CLIENT_URL}/auth/login?error=server_error`);
  }
};

/**
 * @desc    Link Google account với tài khoản hiện tại
 * @route   POST /api/auth/google/link
 * @access  Private
 */
exports.linkGoogleAccount = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user._id;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token Google là bắt buộc'
      });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, picture } = payload;

    // Kiểm tra Google ID đã được dùng chưa
    const existingGoogleUser = await User.findOne({ googleId });
    if (existingGoogleUser && existingGoogleUser._id.toString() !== userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản Google này đã được liên kết với tài khoản khác'
      });
    }

    // Kiểm tra email có khớp không
    const user = await User.findById(userId);
    if (user.email !== email) {
      return res.status(400).json({
        success: false,
        message: 'Email Google không khớp với email tài khoản hiện tại'
      });
    }

    // Link Google account
    user.googleId = googleId;
    user.avatar = picture || user.avatar;
    user.isVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Liên kết tài khoản Google thành công',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          avatar: user.avatar,
          googleId: user.googleId,
          isVerified: user.isVerified
        }
      }
    });

  } catch (error) {
    console.error('Link Google Account Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi liên kết tài khoản Google',
      error: error.message
    });
  }
};

/**
 * @desc    Unlink Google account
 * @route   DELETE /api/auth/google/unlink
 * @access  Private
 */
exports.unlinkGoogleAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user.googleId) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản chưa được liên kết với Google'
      });
    }

    // Kiểm tra user có password không (để đảm bảo vẫn đăng nhập được)
    if (!user.password || user.password.startsWith('GOOGLE_AUTH_')) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng đặt mật khẩu trước khi hủy liên kết Google'
      });
    }

    // Unlink Google account
    user.googleId = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Hủy liên kết tài khoản Google thành công',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          googleId: user.googleId
        }
      }
    });

  } catch (error) {
    console.error('Unlink Google Account Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi hủy liên kết tài khoản Google',
      error: error.message
    });
  }
};
