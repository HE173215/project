const Room = require('../models/Room')

// @desc    Tạo room mới
// @route   POST /api/rooms
// @access  Private (Admin or Manager)
exports.createRoom = async (req, res) => {
  try {
    const { name, capacity, type, building, floor, equipment } = req.body

    // Validate required fields
    if (!name || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Name và capacity là bắt buộc'
      })
    }

    // Kiểm tra room name đã tồn tại chưa
    const existingRoom = await Room.findOne({ name })
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: 'Tên phòng đã tồn tại'
      })
    }

    const room = await Room.create({
      name,
      capacity,
      type,
      building,
      floor,
      equipment
    })

    res.status(201).json({
      success: true,
      message: 'Tạo phòng học thành công',
      data: room
    })
  } catch (error) {
    console.error('❌ Lỗi createRoom:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Lấy tất cả rooms
// @route   GET /api/rooms
// @access  Public
exports.getAllRooms = async (req, res) => {
  try {
    const { search, type, status, minCapacity, page = 1, limit = 10 } = req.query

    const query = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { building: { $regex: search, $options: 'i' } }
      ]
    }

    if (type) {
      query.type = type
    }

    if (status) {
      query.status = status
    }

    if (minCapacity) {
      query.capacity = { $gte: parseInt(minCapacity) }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const rooms = await Room.find(query)
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ name: 1 })

    const total = await Room.countDocuments(query)

    res.status(200).json({
      success: true,
      count: rooms.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: rooms
    })
  } catch (error) {
    console.error('❌ Lỗi getAllRooms:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Lấy room theo ID
// @route   GET /api/rooms/:id
// @access  Public
exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng học'
      })
    }

    res.status(200).json({
      success: true,
      data: room
    })
  } catch (error) {
    console.error('❌ Lỗi getRoomById:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Cập nhật room
// @route   PUT /api/rooms/:id
// @access  Private (Admin or Manager)
exports.updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng học'
      })
    }

    const { name, capacity, type, building, floor, equipment, status } = req.body

    // Nếu update name, kiểm tra trùng
    if (name && name !== room.name) {
      const existingRoom = await Room.findOne({ name })
      if (existingRoom) {
        return res.status(400).json({
          success: false,
          message: 'Tên phòng đã tồn tại'
        })
      }
    }

    // Update fields
    if (name !== undefined) room.name = name
    if (capacity !== undefined) room.capacity = capacity
    if (type !== undefined) room.type = type
    if (building !== undefined) room.building = building
    if (floor !== undefined) room.floor = floor
    if (equipment !== undefined) room.equipment = equipment
    if (status !== undefined) room.status = status

    await room.save()

    res.status(200).json({
      success: true,
      message: 'Cập nhật phòng học thành công',
      data: room
    })
  } catch (error) {
    console.error('❌ Lỗi updateRoom:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}

// @desc    Xóa room
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng học'
      })
    }

    await room.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Xóa phòng học thành công'
    })
  } catch (error) {
    console.error('❌ Lỗi deleteRoom:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    })
  }
}
