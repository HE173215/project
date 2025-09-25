const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
require("dotenv").config()

require("./models/User")
require("./models/Department")
const authRoutes = require("./routes/auth")
const departmentRoutes = require("./routes/department")

const app = express()

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173"
]

// Cho phep front end truy cap API thong qua CORS
app.use(cors({
  origin: allowedOrigins,
}))

// Cho phep Express doc du lieu JSON tu body request
app.use(express.json())

const PORT = process.env.PORT || 5000
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/project"

// Endpoint kiem tra nhanh tinh trang server
app.get("/", (req, res) => res.send("Hello world"))
// Dang ky router xu ly nghiep vu xac thuc
app.use("/auth", authRoutes)
// Quan ly phong ban, bat buoc dang nhap
app.use("/departments", departmentRoutes)

// Ket noi MongoDB roi moi khoi dong server
mongoose.connect(mongoUri)
  .then(() => {
    console.log("Connected to MongoDB")
    app.listen(PORT, () => console.log(`Server listening on ${PORT}`))
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err)
    process.exit(1)
  })