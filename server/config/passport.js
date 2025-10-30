const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
// Only initialize if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL},
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Kiểm tra user đã tồn tại chưa
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User đã tồn tại, cập nhật thông tin
          user.lastLogin = Date.now();
          await user.save();
          return done(null, user);
        }

        // Kiểm tra email đã được dùng chưa
        const existingEmailUser = await User.findOne({ 
          email: profile.emails[0].value 
        });

        if (existingEmailUser) {
          // Email đã tồn tại, link Google account
          existingEmailUser.googleId = profile.id;
          existingEmailUser.avatar = profile.photos[0]?.value || existingEmailUser.avatar;
          existingEmailUser.isVerified = true; // Google account đã verified
          existingEmailUser.lastLogin = Date.now();
          await existingEmailUser.save();
          return done(null, existingEmailUser);
        }

        // Tạo user mới
        const newUser = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          username: profile.emails[0].value.split('@')[0] + '_' + Date.now(),
          fullName: profile.displayName,
          avatar: profile.photos[0]?.value,
          isVerified: true, // Google account đã verified
          password: 'GOOGLE_AUTH_' + Math.random().toString(36), // Random password
          lastLogin: Date.now()
        });

        done(null, newUser);
      } catch (error) {
        console.error('Google OAuth Error:', error);
        done(error, null);
      }
    }
  )
);
} else {
  console.warn('⚠️  Google OAuth credentials not configured. Google login will be disabled.');
}

module.exports = passport;
