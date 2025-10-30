const rateLimit = require('express-rate-limit')

// Rate limiter cho authentication endpoints
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  trustProxy: true // ✅ THÊM DÒNG NÀY
})

// Rate limiter cho API endpoints chung
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 10000 : 500,
  message: {
    success: false,
    message: 'Quá nhiều requests. Vui lòng thử lại sau'
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true, // ✅ THÊM DÒNG NÀY
  skip: (req) => {
    if (process.env.NODE_ENV === 'development') {
      return true
    }
    return req.method === 'GET'
  }
})

// Rate limiter nghiêm ngặt cho sensitive operations
exports.strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Quá nhiều lần thử. Vui lòng thử lại sau 1 giờ'
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true // ✅ THÊM DÒNG NÀY
})

// CORS configuration
exports.corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : [
          'http://localhost:3000',
          'http://localhost:5173' // ✅ Thêm default cho dev
        ]
    
    if (!origin) {
      return callback(null, true)
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.warn(`⚠️  CORS blocked origin: ${origin}`)
      // ✅ SỬA: Không nên throw error, chỉ log
      callback(null, false)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600,
  optionsSuccessStatus: 200
}

// Helmet configuration
exports.helmetOptions = {
  contentSecurityPolicy: false, // ✅ Tắt CSP để tránh conflict
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}
```

**2. Thêm biến môi trường `ALLOWED_ORIGINS` trên Render:**

Vào **Render Dashboard** → **Your Service** → **Environment** → Thêm:
```
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://project-eight-psi-18.vercel.app,https://project-1rhkudpmu-he173215s-projects.vercel.app