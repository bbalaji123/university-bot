// ========================================
// BACKEND LESSON 3: Authentication Routes
// ========================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

const router = express.Router();

const isProduction = process.env.NODE_ENV === 'production';
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (secret) {
    return secret;
  }

  if (isProduction) {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }

  return 'your-secret-key';
};

// ========================================
// 🔐 HELPER FUNCTIONS
// ========================================

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    getJwtSecret(),
    { expiresIn: '7d' } // Token expires in 7 days
  );
};

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      message: 'Please provide a valid token' 
    });
  }

  jwt.verify(token, getJwtSecret(), (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Invalid token',
        message: 'Token is invalid or expired' 
      });
    }
    req.userId = decoded.userId;
    next();
  });
};

const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('role isActive');

    if (!user || !user.isActive) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Account inactive'
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin access required'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({
      error: 'Authorization failed',
      message: 'Server error'
    });
  }
};

// ========================================
// 📝 VALIDATION MIDDLEWARE
// ========================================

const validateRegistration = (req, res, next) => {
  const {
    fullName,
    firstName,
    lastName,
    password,
    studentId,
    year,
    section,
    gpa,
    mobileNumber
  } = req.body;
  const resolvedFirstName = firstName || fullName?.trim().split(/\s+/)[0];
  const resolvedLastName =
    lastName ||
    fullName?.trim().split(/\s+/).slice(1).join(' ') ||
    'Student';
  
  // Basic validation
  if (!resolvedFirstName || !resolvedLastName || !password || !studentId || !year || !section) {
    return res.status(400).json({
      error: 'All fields are required',
      fields: ['fullName', 'studentId', 'year', 'section', 'mobileNumber']
    });
  }

  if (mobileNumber && !/^\d{10}$/.test(mobileNumber)) {
    return res.status(400).json({
      error: 'Mobile number must be exactly 10 digits'
    });
  }

  if (Number(year) < 1 || Number(year) > 6) {
    return res.status(400).json({
      error: 'Year must be between 1 and 6'
    });
  }

  if (gpa !== undefined && gpa !== null && gpa !== '' && (Number(gpa) < 0 || Number(gpa) > 10)) {
    return res.status(400).json({
      error: 'CGPA must be between 0 and 10'
    });
  }
  
  // Password strength validation
  if (password.length < 6) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters'
    });
  }
  
  next();
};

// ========================================
// 🚀 ROUTES
// ========================================

// POST /api/auth/register
// Register new student account
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const {
      fullName,
      firstName,
      lastName,
      email,
      password,
      studentId,
      program,
      year,
      section,
      gpa,
      mobileNumber
    } = req.body;
    const resolvedFirstName = firstName || fullName?.trim().split(/\s+/)[0];
    const resolvedLastName =
      lastName ||
      fullName?.trim().split(/\s+/).slice(1).join(' ') ||
      'Student';
    
    // Check if user already exists
    const existingUser = await User.findOne({
      studentId
    });
    
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'Student ID already registered'
      });
    }
    
    // Hash password (NEVER store plain passwords)
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create new user
    const newUser = new User({
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      email,
      password: hashedPassword,
      studentId,
      program: program || 'Computer Science',
      year: Number(year),
      section: String(section).toUpperCase(),
      gpa: gpa !== undefined && gpa !== null && gpa !== '' ? Number(gpa) : 0.0,
      mobileNumber: mobileNumber || password
    });
    
    await newUser.save();
    
    // Generate token for immediate login
    const token = generateToken(newUser._id);
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        studentId: newUser.studentId,
        program: newUser.program,
        year: newUser.year,
        section: newUser.section,
        gpa: newUser.gpa,
        mobileNumber: newUser.mobileNumber
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'Server error during registration'
    });
  }
});

// POST /api/auth/login
// Authenticate existing user
router.post('/login', async (req, res) => {
  try {
    const { studentId, adminId, password, role } = req.body;

    const loginId = role === 'admin' ? adminId : studentId;

    console.log('[auth/login] role:', role, 'adminId:', adminId, 'studentId:', studentId);

    if (!loginId) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Login ID is required'
      });
    }
    
    // Find user by studentId
    const user = await User.findOne(
      role === 'admin'
        ? { adminId: loginId }
        : { studentId: loginId }
    );

    console.log('[auth/login] user found:', Boolean(user));
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Student not found'
      });
    }
    
    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Incorrect password'
      });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account deactivated',
        message: 'Please contact support'
      });
    }

    // Role check for admin logins
    if (role && user.role !== role) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Role mismatch for this account'
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate token
    const token = generateToken(user._id);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        studentId: user.studentId,
        program: user.program,
        year: user.year,
        gpa: user.gpa,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'Server error during login'
    });
  }
});

// POST /api/auth/forgot-password
// Reset student password after validating student details
router.post('/forgot-password', async (req, res) => {
  try {
    const { studentId, year, section, newPassword } = req.body;

    if (!studentId || !year || !section || !newPassword) {
      return res.status(400).json({
        error: 'All fields are required',
        fields: ['studentId', 'year', 'section', 'newPassword']
      });
    }

    if (Number(year) < 1 || Number(year) > 6) {
      return res.status(400).json({
        error: 'Year must be between 1 and 6'
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters'
      });
    }

    const user = await User.findOne({ studentId, role: 'student' });
    if (!user) {
      return res.status(404).json({
        error: 'Student not found'
      });
    }

    const isYearMatch = Number(user.year) === Number(year);
    const isSectionMatch = String(user.section || '').toUpperCase() === String(section).toUpperCase();

    if (!isYearMatch || !isSectionMatch) {
      return res.status(401).json({
        error: 'Verification failed',
        message: 'Student details do not match our records'
      });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(String(newPassword), saltRounds);
    user.password = hashedPassword;
    user.updatedAt = new Date();
    await user.save();

    res.json({
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Password reset failed',
      message: 'Server error during password reset'
    });
  }
});

// GET /api/auth/profile
// Get authenticated user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password'); // Exclude password
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        studentId: user.studentId,
        program: user.program,
        year: user.year,
        gpa: user.gpa,
        language: user.language,
        theme: user.theme,
        socialProfiles: user.socialProfiles,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
    
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: 'Server error'
    });
  }
});

// PUT /api/auth/profile
// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['firstName', 'lastName', 'email', 'language', 'theme', 'socialProfiles'];
    
    // Filter only allowed fields
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { ...filteredUpdates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        studentId: user.studentId,
        program: user.program,
        year: user.year,
        gpa: user.gpa,
        language: user.language,
        theme: user.theme,
        socialProfiles: user.socialProfiles
      }
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Profile update failed',
      message: 'Server error'
    });
  }
});

// POST /api/auth/logout
// Logout user (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  // In a real app, you might:
  // 1. Add token to blacklist
  // 2. Log logout activity
  // 3. Clear refresh tokens
  
  res.json({
    message: 'Logout successful',
    timestamp: new Date().toISOString()
  });
});

module.exports = { router, authenticateToken, requireAdmin };
