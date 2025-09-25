// models/Department.js
const mongoose = require("mongoose")

const DepartmentSchema = new mongoose.Schema(
  {
    // Department code (unique, used for integrations)
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true, // e.g. IT01, HR02
    },

    // Department name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional description (purpose, responsibilities...)
    description: {
      type: String,
      default: "",
    },

    // Active status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Department manager / owner
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Parent department (for hierarchies)
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    // Users belonging to this department
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt
  },
)

module.exports = mongoose.model("Department", DepartmentSchema)
