const { Router } = require("express")
const authController = require("../controllers/authController")
const { authenticate, requireRoles } = require("../middleware/authMiddleware")

const router = Router()

// Dinh nghia cac endpoint lien quan toi xac thuc nguoi dung
router.post("/register", authController.register)
router.post("/login", authController.login)
router.post("/verify-otp", authController.verifyOtp)
router.post("/resend-otp", authController.resendOtp)
router.post("/forgot-password", authController.requestPasswordReset)
router.post("/reset-password", authController.resetPassword)
router.put("/profile", authenticate, authController.updateProfile)
router.get("/me", authenticate, authController.getProfile)
router.get("/users", authenticate, requireRoles("admin", "manager"), authController.listUsers)
router.put("/users/:id/roles", authenticate, requireRoles("admin"), authController.updateUserRoles)

module.exports = router
