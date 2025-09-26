const argon2 = require("argon2")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const sanitizeUser = require("../utils/sanitizeUser")
const generateOtp = require("../utils/generateOtp")
const { sendOtpEmail } = require("../services/emailService")
const mongoose = require("mongoose")
const ALLOWED_ROLES = new Set(["admin", "manager", "user", "employee", "accountant", "learn"])

// Build a JWT token for an authenticated user
const buildToken = (user) => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET is not configured")
  }

  return jwt.sign(
    {
      sub: user._id.toString(),
      roles: user.roles,
    },
    secret,
    { expiresIn: "7d" },
  )
}

// Send a fresh OTP and persist its hash/expiry on the user document
const prepareAndSendOtp = async (user, purpose) => {
  const { code, expiresAt } = generateOtp()
  const expiresMinutes = Number(process.env.OTP_EXPIRES_MINUTES || 10)
  const otpHash = await argon2.hash(code)

  await sendOtpEmail({
    to: user.email,
    otpCode: code,
    recipientName: user.fullName,
    expiresMinutes,
    purpose,
  })

  user.otpHash = otpHash
  user.otpExpiresAt = expiresAt
  user.otpPurpose = purpose
}

exports.register = async (req, res) => {
  try {
    const { email, password, fullName } = req.body

    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const normalizedEmail = String(email).toLowerCase().trim()

    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" })
    }

    const user = new User({
      email: normalizedEmail,
      passwordHash: await argon2.hash(String(password)),
      fullName: String(fullName).trim(),
    })

    await prepareAndSendOtp(user, "verify_email")

    await user.save()

    return res.status(201).json({
      message: "Account registered successfully",
      user: sanitizeUser(user),
    })
  } catch (error) {
    console.error("Register error", error)
    return res.status(500).json({ message: "Failed to register user" })
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    const normalizedEmail = String(email).toLowerCase().trim()
    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is disabled" })
    }

    const passwordValid = await argon2.verify(user.passwordHash, password)
    if (!passwordValid) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    if (!user.emailVerified) {
      await prepareAndSendOtp(user, "verify_email")
      await user.save()

      return res.status(403).json({
        message: "Email not verified",
        requiresVerification: true,
      })
    }

    const token = buildToken(user)

    return res.json({
      message: "Signed in successfully",
      user: sanitizeUser(user),
      token,
    })
  } catch (error) {
    console.error("Login error", error)
    if (error.message.includes("JWT_SECRET")) {
      return res.status(500).json({ message: "Server configuration error" })
    }
    return res.status(500).json({ message: "Failed to login" })
  }
}

exports.getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" })
    }

    return res.json({ user: req.user })
  } catch (error) {
    console.error("Get profile error", error)
    return res.status(500).json({ message: "Failed to get profile" })
  }
}

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const updates = req.body || {}

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is disabled" })
    }

    Object.assign(user, updates)

    await user.save()

    return res.json({
      message: "Profile updated successfully",
      user: sanitizeUser(user),
    })
  } catch (error) {
    console.error("Update profile error", error)
    return res.status(500).json({ message: "Failed to update profile" })
  }
}

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" })
    }

    const normalizedEmail = String(email).toLowerCase().trim()

    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.emailVerified) {
      const token = buildToken(user)
      return res.json({
        message: "Email already verified",
        user: sanitizeUser(user),
        token,
      })
    }

    if (!user.otpHash || !user.otpExpiresAt || user.otpPurpose !== "verify_email") {
      return res.status(400).json({ message: "OTP is not set" })
    }

    if (user.otpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: "OTP expired" })
    }

    const otpValid = await argon2.verify(user.otpHash, String(otp).trim())
    if (!otpValid) {
      return res.status(400).json({ message: "Invalid OTP" })
    }

    user.emailVerified = true
    user.otpHash = undefined
    user.otpExpiresAt = undefined
    user.otpPurpose = undefined

    await user.save()

    const token = buildToken(user)

    return res.json({
      message: "Email verified successfully",
      user: sanitizeUser(user),
      token,
    })
  } catch (error) {
    console.error("Verify OTP error", error)
    if (error.message.includes("JWT_SECRET")) {
      return res.status(500).json({ message: "Server configuration error" })
    }
    return res.status(500).json({ message: "Failed to verify OTP" })
  }
}

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ message: "Email is required" })
    }

    const normalizedEmail = String(email).toLowerCase().trim()
    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.emailVerified) {
      const token = buildToken(user)
      return res.json({
        message: "Email already verified",
        user: sanitizeUser(user),
        token,
      })
    }

    await prepareAndSendOtp(user, "verify_email")
    await user.save()

    return res.json({ message: "OTP sent" })
  } catch (error) {
    console.error("Resend OTP error", error)
    return res.status(500).json({ message: "Failed to resend OTP" })
  }
}

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ message: "Email is required" })
    }

    const normalizedEmail = String(email).toLowerCase().trim()

    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is disabled" })
    }

    await prepareAndSendOtp(user, "reset_password")
    await user.save()

    return res.json({ message: "OTP sent" })
  } catch (error) {
    console.error("Request reset password error", error)
    return res.status(500).json({ message: "Failed to send OTP" })
  }
}

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const normalizedEmail = String(email).toLowerCase().trim()
    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is disabled" })
    }

    if (!user.otpHash || !user.otpExpiresAt || user.otpPurpose !== "reset_password") {
      return res.status(400).json({ message: "OTP is not set" })
    }

    if (user.otpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: "OTP expired" })
    }

    const otpValid = await argon2.verify(user.otpHash, String(otp).trim())
    if (!otpValid) {
      return res.status(400).json({ message: "Invalid OTP" })
    }

    user.passwordHash = await argon2.hash(String(newPassword))
    user.emailVerified = true
    user.otpHash = undefined
    user.otpExpiresAt = undefined
    user.otpPurpose = undefined

    await user.save()

    const token = buildToken(user)

    return res.json({
      message: "Password reset successfully",
      user: sanitizeUser(user),
      token,
    })
  } catch (error) {
    console.error("Reset password error", error)
    if (error.message.includes("JWT_SECRET")) {
      return res.status(500).json({ message: "Server configuration error" })
    }
    return res.status(500).json({ message: "Failed to reset password" })
  }
}

exports.listUsers = async (req, res) => {
  try {
    const { includeInactive } = req.query || {}
    const filter = {}

    if (String(includeInactive || "").toLowerCase() !== "true") {
      filter.isActive = true
    }

    const users = await User.find(filter).sort({ fullName: 1, email: 1 })

    return res.json({
      items: users.map((user) => sanitizeUser(user)),
    })
  } catch (error) {
    console.error("List users error", error)
    return res.status(500).json({ message: "Failed to fetch users" })
  }
}


exports.updateUserRoles = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" })
    }

    const { roles } = req.body || {}
    if (!Array.isArray(roles) || !roles.length) {
      return res.status(400).json({ message: "Roles must be a non-empty array" })
    }

    const normalizedRoles = [...new Set(roles.map((role) => String(role).toLowerCase().trim()))]
    const invalidRole = normalizedRoles.find((role) => !ALLOWED_ROLES.has(role))
    if (invalidRole) {
      return res.status(400).json({ message: `Invalid role: ${invalidRole}` })
    }

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (String(user._id) === req.user.id && !normalizedRoles.includes("admin")) {
      return res.status(400).json({ message: "You cannot remove your own admin access" })
    }

    user.roles = normalizedRoles
    await user.save()

    return res.json({
      message: "User roles updated",
      user: sanitizeUser(user),
    })
  } catch (error) {
    console.error("Update user roles error", error)
    return res.status(500).json({ message: "Failed to update user roles" })
  }
}





