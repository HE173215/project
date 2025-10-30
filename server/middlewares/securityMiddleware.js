const rateLimit = require('express-rate-limit')

// Rate limiter cho authentication endpoints
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false
})

// Rate limiter cho API endpoints chung
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 10000 : 500, // Higher limit for development
  message: {
    success: false,
    message: 'Quá nhiều requests. Vui lòng thử lại sau'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip ALL rate limiting in development
    if (process.env.NODE_ENV === 'development') {
      return true
    }
    // Skip rate limiting for GET requests in production
    return req.method === 'GET'
  }
})

// Rate limiter nghiêm ngặt cho sensitive operations
exports.strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: {
    success: false,
    message: 'Quá nhiều lần thử. Vui lòng thử lại sau 1 giờ'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// CORS configuration
exports.corsOptions = {
  origin: function (origin, callback) {
    // Lấy allowed origins từ environment variable
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : ['http://localhost:3000']
    
    // Cho phép requests không có origin (mobile apps, Postman, curl)
    if (!origin) {
      return callback(null, true)
    }
    
    // Kiểm tra origin có trong whitelist không
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.warn(`⚠️  CORS blocked origin: ${origin}`)
      callback(new Error('Not allowed by CORS policy'))
    }
  },
  credentials: true, // Cho phép gửi cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600, // Cache preflight request for 10 minutes
  optionsSuccessStatus: 200
}

// Helmet configuration
exports.helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for development
  crossOriginResourcePolicy: { policy: "cross-origin" }
}
