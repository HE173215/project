const mongoose = require("mongoose")
const Department = require("../models/Department")
const sanitizeUser = require("../utils/sanitizeUser")

// Normalize department payloads before returning to clients
const sanitizeDepartment = (dept, options = { populateUsers: false }) => {
  if (!dept) return null

  const base = {
    id: dept._id?.toString?.() || dept.id,
    code: dept.code,
    name: dept.name,
    description: dept.description,
    isActive: dept.isActive,
    manager: dept.manager?._id
      ? sanitizeUser(dept.manager)
      : dept.manager?.toString?.() || dept.manager,
    parentId: dept.parentId?._id
      ? {
          id: dept.parentId._id.toString(),
          name: dept.parentId.name,
          code: dept.parentId.code,
        }
      : dept.parentId?.toString?.() || dept.parentId,
    createdAt: dept.createdAt,
    updatedAt: dept.updatedAt,
  }

  if (options.populateUsers && Array.isArray(dept.users)) {
    base.users = dept.users.map((u) =>
      u && typeof u === "object" ? sanitizeUser(u) : u?.toString?.() || u,
    )
  } else if (Array.isArray(dept.users)) {
    base.users = dept.users.map((u) => u?.toString?.() || u)
  }

  return base
}

// GET /departments
exports.listDepartments = async (req, res) => {
  try {
    const { includeUsers } = req.query || {}
    const populateUsers = String(includeUsers || "").toLowerCase() === "true"

    const query = Department.find()
      .populate("manager", "-password")
      .populate("parentId", "name code")

    if (populateUsers) query.populate("users")

    const departments = await query.sort({ createdAt: -1 })

    return res.json({
      items: departments.map((d) => sanitizeDepartment(d, { populateUsers })),
    })
  } catch (err) {
    console.error("List departments error", err)
    return res.status(500).json({ message: "Failed to fetch departments" })
  }
}

// GET /departments/:id
exports.getDepartment = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid department id" })
    }

    const populateUsers = String(req.query?.includeUsers || "").toLowerCase() === "true"

    const query = Department.findById(id)
      .populate("manager", "-password")
      .populate("parentId", "name code")

    if (populateUsers) query.populate("users")

    const department = await query
    if (!department) return res.status(404).json({ message: "Department not found" })

    return res.json({ department: sanitizeDepartment(department, { populateUsers }) })
  } catch (err) {
    console.error("Get department error", err)
    return res.status(500).json({ message: "Failed to fetch department" })
  }
}

// POST /departments
exports.createDepartment = async (req, res) => {
  try {
    const { code, name, description, users = [], manager, parentId } = req.body

    // Guard against duplicate code or name
    const existingCode = await Department.findOne({ code })
    if (existingCode) {
      return res.status(409).json({ message: "Department code already exists" })
    }

    const existingName = await Department.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    })
    if (existingName) {
      return res.status(409).json({ message: "Department name already exists" })
    }

    const department = await Department.create({
      code,
      name,
      description,
      users,
      manager: manager || null,
      parentId: parentId || null,
    })

    return res.status(201).json({
      message: "Department created successfully",
      department: sanitizeDepartment(department),
    })
  } catch (err) {
    console.error("Create department error", err)
    return res.status(500).json({ message: "Failed to create department" })
  }
}

// PUT /departments/:id
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid department id" })
    }

    const updates = req.body

    // Prevent duplicate code when updating
    if (updates.code) {
      const duplicate = await Department.findOne({ _id: { $ne: id }, code: updates.code })
      if (duplicate) {
        return res.status(409).json({ message: "Department code already exists" })
      }
    }

    // Prevent duplicate name when updating
    if (updates.name) {
      const duplicate = await Department.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${updates.name}$`, "i") },
      })
      if (duplicate) {
        return res.status(409).json({ message: "Department name already exists" })
      }
    }

    const department = await Department.findByIdAndUpdate(id, updates, { new: true })
      .populate("manager", "-password")
      .populate("parentId", "name code")

    if (!department) {
      return res.status(404).json({ message: "Department not found" })
    }

    return res.json({
      message: "Department updated successfully",
      department: sanitizeDepartment(department),
    })
  } catch (err) {
    console.error("Update department error", err)
    return res.status(500).json({ message: "Failed to update department" })
  }
}

// DELETE /departments/:id
exports.removeDepartment = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid department id" })
    }

    const department = await Department.findByIdAndDelete(id)
    if (!department) {
      return res.status(404).json({ message: "Department not found" })
    }

    return res.json({ message: "Department deleted successfully" })
  } catch (err) {
    console.error("Delete department error", err)
    return res.status(500).json({ message: "Failed to delete department" })
  }
}
