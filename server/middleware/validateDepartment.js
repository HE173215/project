const mongoose = require("mongoose")

// Check whether a value is a valid Mongo ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

// Validation middleware for department creation
const validateCreateDepartment = (req, res, next) => {
  const { code, name, users = [], manager, parentId } = req.body || {}

  if (!code || !String(code).trim()) {
    return res.status(400).json({ message: "Code is required" })
  }
  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: "Name is required" })
  }

  // Validate user references
  if (!Array.isArray(users)) {
    return res.status(400).json({ message: "Users must be an array" })
  }
  for (const u of users) {
    if (u && !isValidObjectId(u)) {
      return res.status(400).json({ message: `Invalid user id: ${u}` })
    }
  }

  // Validate manager reference
  if (manager && !isValidObjectId(manager)) {
    return res.status(400).json({ message: "Invalid manager id" })
  }

  // Validate parent reference
  if (parentId && !isValidObjectId(parentId)) {
    return res.status(400).json({ message: "Invalid parent department id" })
  }

  // Normalize payload before passing downstream
  req.body.code = String(code).trim().toUpperCase()
  req.body.name = String(name).trim()
  if (req.body.description) {
    req.body.description = String(req.body.description).trim()
  }

  next()
}

// Validation middleware for department updates
const validateUpdateDepartment = (req, res, next) => {
  const { code, name, users, manager, parentId, isActive } = req.body || {}
  const updates = {}

  if (
    code === undefined &&
    name === undefined &&
    req.body.description === undefined &&
    users === undefined &&
    manager === undefined &&
    parentId === undefined &&
    isActive === undefined
  ) {
    return res.status(400).json({ message: "No fields provided" })
  }

  if (code !== undefined) {
    if (!String(code).trim()) {
      return res.status(400).json({ message: "Code cannot be empty" })
    }
    updates.code = String(code).trim().toUpperCase()
  }

  if (name !== undefined) {
    if (!String(name).trim()) {
      return res.status(400).json({ message: "Name cannot be empty" })
    }
    updates.name = String(name).trim()
  }

  if (users !== undefined) {
    if (!Array.isArray(users)) {
      return res.status(400).json({ message: "Users must be an array" })
    }
    for (const u of users) {
      if (u && !isValidObjectId(u)) {
        return res.status(400).json({ message: `Invalid user id: ${u}` })
      }
    }
    updates.users = users
  }

  if (manager !== undefined) {
    if (manager && !isValidObjectId(manager)) {
      return res.status(400).json({ message: "Invalid manager id" })
    }
    updates.manager = manager || null
  }

  if (parentId !== undefined) {
    if (parentId && !isValidObjectId(parentId)) {
      return res.status(400).json({ message: "Invalid parent department id" })
    }
    updates.parentId = parentId || null
  }

  if (isActive !== undefined) {
    updates.isActive = Boolean(isActive)
  }

  if (req.body.description !== undefined) {
    updates.description = req.body.description ? String(req.body.description).trim() : ""
  }

  req.body = updates // forward the sanitized payload
  next()
}

module.exports = {
  validateCreateDepartment,
  validateUpdateDepartment,
}
