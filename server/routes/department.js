const { Router } = require("express")
const departmentController = require("../controllers/departmentController")
const { authenticate, requireRoles } = require("../middleware/authMiddleware")
const {
  validateCreateDepartment,
  validateUpdateDepartment,
} = require("../middleware/validateDepartment")

const router = Router()

// List departments
router.get("/", authenticate, departmentController.listDepartments)

// Get department details
router.get("/:id", authenticate, departmentController.getDepartment)

// Create department (admin or manager)
router.post(
  "/",
  authenticate,
  requireRoles("admin", "manager"),
  validateCreateDepartment,
  departmentController.createDepartment,
)

// Update department (admin or manager)
router.put(
  "/:id",
  authenticate,
  requireRoles("admin", "manager"),
  validateUpdateDepartment,
  departmentController.updateDepartment,
)

// Delete department (admin or manager)
router.delete(
  "/:id",
  authenticate,
  requireRoles("admin", "manager"),
  departmentController.removeDepartment,
)

module.exports = router
