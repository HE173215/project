const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const { protect, authorize } = require('../middlewares/authMiddleware')

// Tất cả routes đều yêu cầu authentication
router.use(protect)

// Routes cho tất cả user đã đăng nhập
router.get('/:id', userController.getUserById)
router.put('/:id', userController.updateUser)

// Routes cho Admin và Manager (chỉ xem, không sửa/xóa)
router.get('/', authorize('admin', 'manager'), userController.getAllUsers)

// Routes chỉ dành cho admin
router.post('/create', authorize('admin'), userController.createUser)
router.delete('/:id', authorize('admin'), userController.deleteUser)
router.patch('/:id/block', authorize('admin'), userController.toggleBlockUser)
router.patch('/:id/role', authorize('admin'), userController.changeUserRole)

module.exports = router
