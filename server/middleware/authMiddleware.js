const jwt = require("jsonwebtoken")
const User = require("../models/User")
const sanitizeUser = require("../utils/sanitizeUser")

// Kiem tra token Bearer va gan thong tin user vao request
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization || ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null

  if (!token) {
    return res.status(401).json({ message: "Authentication required" })
  }

  try {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error("JWT_SECRET is not configured")
    }

    const payload = jwt.verify(token, secret)

    const user = await User.findById(payload.sub)
    if (!user) {
      return res.status(401).json({ message: "Invalid token" })
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is disabled" })
    }

    req.user = sanitizeUser(user)
    return next()
  } catch (error) {
    console.error("Authentication error", error)
    if (error.message.includes("JWT_SECRET")) {
      return res.status(500).json({ message: "Server configuration error" })
    }
    return res.status(401).json({ message: "Invalid or expired token" })
  }
}

// Chan truy cap neu user khong co vai tro phu hop
const requireRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" })
  }

  if (!allowedRoles.length) {
    return next()
  }

  const userRoles = req.user.roles || []
  const hasRole = allowedRoles.some((role) => userRoles.includes(role))

  if (!hasRole) {
    return res.status(403).json({ message: "Forbidden" })
  }

  return next()
}

module.exports = {
  authenticate,
  requireRoles,
}