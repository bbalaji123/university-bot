// ========================================
// BACKEND LESSON 1: Main Server Setup
// ========================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const requireEnv = (name, fallback = null) => {
  const value = process.env[name];

  if (value) {
    return value;
  }

  if (isProduction) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return fallback;
};

// Import Routes for Data Storage
const { router: authRouter, authenticateToken } = require('./routes/auth');
const chatRouter = require('./routes/chat');
const adminRouter = require('./routes/admin');
const admissionsRouter = require('./routes/admissions');
const academicRouter = require('./routes/academic');
const financialRouter = require('./routes/financial');
const campusRouter = require('./routes/campus');
const mentalHealthRouter = require('./routes/mentalHealth');
const careerRouter = require('./routes/career');
const { User } = require('./models/User');

// Initialize Express App
const app = express();

// ========================================
// 🎯 SECURITY MIDDLEWARE
// ========================================

// Helmet: Security Headers
// Protects against common web vulnerabilities
app.use(helmet());

// CORS: Cross-Origin Resource Sharing
// Allows frontend (React app) to communicate with backend
const allowedOrigins = [
  requireEnv('FRONTEND_URL'),
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Rate Limiting: Prevent API Abuse
// Limits requests per IP to prevent spam/attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body Parsing: Handle JSON and form data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const ensureAdminUser = async () => {
  const adminId = process.env.ADMIN_ID || (!isProduction ? 'ADMIN01' : null);
  const adminPassword = process.env.ADMIN_PASSWORD || (!isProduction ? 'Admin@123' : null);

  if (!adminId || !adminPassword) {
    return;
  }

  const existingAdmin = await User.findOne({ adminId });
  if (existingAdmin) {
    if (String(process.env.ADMIN_FORCE_RESET).toLowerCase() === 'true') {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'admin';
      existingAdmin.isActive = true;
      await existingAdmin.save();
      console.log(`✅ Admin password reset for: ${adminId}`);
    }
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  const firstName = process.env.ADMIN_FIRST_NAME || 'System';
  const lastName = process.env.ADMIN_LAST_NAME || 'Admin';

  await User.create({
    firstName,
    lastName,
    password: hashedPassword,
    adminId,
    role: 'admin',
    program: 'Computer Science',
    year: 1,
    gpa: 0.0,
    isActive: true
  });

  console.log(`✅ Admin user seeded: ${adminId}`);
};

// ========================================
// 🗄️ DATABASE CONNECTION
// ========================================

// MongoDB Connection using Mongoose
// Mongoose provides schema validation, middleware, etc.
const mongoUri = requireEnv('MONGODB_URI', 'mongodb://localhost:27017/student-support');
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  ensureAdminUser();
}) 
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// ========================================
// 🚀 SERVER STARTUP
// ========================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🗄️ MongoDB URI: ${isProduction ? 'configured' : mongoUri}`);
});

// ========================================
// 📝 BASIC ROUTE TESTING
// ========================================

// API Routes for Data Storage
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/chat', chatRouter);
app.use('/api/admissions', admissionsRouter);
app.use('/api/academic', academicRouter);
app.use('/api/financial', financialRouter);
app.use('/api/campus', campusRouter);
app.use('/api/mental-health', mentalHealthRouter);
app.use('/api/career', careerRouter);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ai-student-support-backend',
    health: '/api/health'
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

module.exports = app;
