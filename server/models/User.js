const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  dateOfBirth: {
    type: Date,
  },
  address: {
    type: String,
    trim: true,
  },
  bio: {
    type: String,
    trim: true,
  },
  avatarUrl: {
    type: String,
    trim: true,
  },
  roles: {
    type: [String],
    default: ["user"],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  otpHash: {
    type: String,
  },
  otpExpiresAt: {
    type: Date,
  },
  otpPurpose: {
    type: String,
    enum: ["verify_email", "reset_password"],
  },
}, {
  timestamps: true,
})

module.exports = mongoose.model("User", userSchema)