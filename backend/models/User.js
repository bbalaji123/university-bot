// ========================================
// BACKEND LESSON 2: Database Models
// ========================================

const mongoose = require('mongoose');

// ========================================
// 👤 USER MODEL
// ========================================
// Purpose: Student authentication and profile management
const userSchema = new mongoose.Schema({
  // Basic Info
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  
  // Student Specific
  studentId: {
    type: String,
    unique: true,
    sparse: true,
    required: function () {
      return this.role !== 'admin';
    }
  },
  adminId: { type: String, unique: true, sparse: true },
  program: { type: String, enum: ['Computer Science', 'Business', 'Engineering', 'Arts', 'Science'] },
  year: { type: Number, min: 1, max: 6 },
  section: { type: String, trim: true, uppercase: true },
  gpa: { type: Number, min: 0.0, max: 10.0 },
  mobileNumber: { type: String, trim: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  
  // Preferences & Settings
  language: { type: String, default: 'en' },
  notifications: { type: Boolean, default: true },
  theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  
  // Social Media Integration
  socialProfiles: {
    facebook: String,
    twitter: String,
    linkedin: String,
    instagram: String
  },
  
  // Metadata
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ========================================
// 💬 CHAT MESSAGE MODEL
// ========================================
// Purpose: Store chat conversations with sentiment analysis
const chatMessageSchema = new mongoose.Schema({
  // Message Content
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, maxlength: 1000 },
  
  // AI Analysis
  sentiment: { 
    type: String, 
    enum: ['positive', 'negative', 'neutral'], 
    default: 'neutral' 
  },
  confidence: { type: Number, min: 0, max: 1, default: 0.5 },
  category: { 
    type: String, 
    enum: ['admission', 'academic', 'financial', 'campus', 'mental-health', 'general'],
    default: 'general'
  },
  
  // Message Metadata
  isFromAI: { type: Boolean, default: false },
  language: { type: String, default: 'en' },
  responseTime: { type: Number }, // AI response time in milliseconds
  
  // Timestamps
  timestamp: { type: Date, default: Date.now }
});

// ========================================
// 🧭 MODULE CONFIG MODEL
// ========================================
// Purpose: Admin-managed module settings and announcements
const moduleSchema = new mongoose.Schema({
  moduleId: { type: String, required: true, unique: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true },
  visibility: {
    type: String,
    enum: ['students', 'admins', 'both'],
    default: 'both'
  },
  announcements: [
    {
      title: { type: String, required: true, trim: true },
      message: { type: String, required: true, trim: true },
      createdAt: { type: Date, default: Date.now },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
  ],
  updatedAt: { type: Date, default: Date.now }
});

// ========================================
// ❓ FAQ MODEL
// ========================================
// Purpose: AI-generated frequently asked questions
const faqSchema = new mongoose.Schema({
  // FAQ Content
  question: { type: String, required: true, maxlength: 500 },
  answer: { type: String, required: true, maxlength: 2000 },
  
  // Categorization
  category: { 
    type: String, 
    enum: ['admission', 'academic', 'financial', 'campus', 'mental-health'],
    required: true 
  },
  priority: { 
    type: String, 
    enum: ['high', 'medium', 'low'], 
    default: 'medium' 
  },
  
  // AI Generation Metadata
  isAIGenerated: { type: Boolean, default: true },
  generationContext: String, // What prompted the AI to generate this
  keywords: [{ type: String }], // Search keywords
  
  // Analytics
  views: { type: Number, default: 0 },
  helpful: { type: Number, default: 0 },
  notHelpful: { type: Number, default: 0 },
  
  // Metadata
  isActive: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// ========================================
// 📱 SOCIAL POST MODEL
// ========================================
// Purpose: Social media integration posts
const socialPostSchema = new mongoose.Schema({
  // Post Content
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  platform: { 
    type: String, 
    enum: ['facebook', 'twitter', 'linkedin', 'instagram', 'youtube'],
    required: true 
  },
  content: { type: String, required: true, maxlength: 1000 },
  
  // Media Attachments
  images: [{ type: String }], // URLs to uploaded images
  links: [{ type: String }], // External links
  
  // Engagement Metrics
  likes: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  
  // Post Settings
  isScheduled: { type: Boolean, default: false },
  scheduledTime: Date,
  isPublished: { type: Boolean, default: true },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ========================================
// 🎫 SUPPORT TICKET MODEL
// ========================================
// Purpose: Student support request tracking
const supportTicketSchema = new mongoose.Schema({
  // Ticket Info
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 2000 },
  source: {
    type: String,
    enum: ['general', 'chatbot'],
    default: 'general'
  },
  studentQuestion: { type: String, maxlength: 2000 },
  language: { type: String, default: 'en' },
  
  // Categorization & Priority
  category: { 
    type: String, 
    enum: ['admission', 'academic', 'financial', 'campus', 'mental-health', 'technical'],
    required: true 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  status: { 
    type: String, 
    enum: ['open', 'in-progress', 'resolved', 'closed'], 
    default: 'open' 
  },
  
  // Assignment & Resolution
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Support staff
  resolution: String,
  resolutionTime: Number, // Time to resolve in hours
  adminAnswer: { type: String, maxlength: 4000 },
  answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  answeredAt: Date,
  studentNotified: { type: Boolean, default: false },
  studentRead: { type: Boolean, default: false },
  
  // Communication
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    timestamp: { type: Date, default: Date.now },
    isInternal: Boolean // True for staff communications
  }],
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  resolvedAt: Date
});

// ========================================
// 👍👎 CHAT FEEDBACK MODELS
// ========================================
// Purpose: Store per-response feedback and aggregated downvote alerts
const chatResponseFeedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  responseId: { type: String, required: true, trim: true },
  question: { type: String, required: true, maxlength: 2000 },
  normalizedQuestion: { type: String, required: true, maxlength: 2000 },
  reply: { type: String, required: true, maxlength: 4000 },
  vote: { type: String, enum: ['up', 'down'], required: true },
  language: { type: String, default: 'en' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const chatFeedbackSummarySchema = new mongoose.Schema({
  normalizedQuestion: { type: String, required: true, unique: true, maxlength: 2000 },
  sampleQuestion: { type: String, required: true, maxlength: 2000 },
  sampleReply: { type: String, maxlength: 4000 },
  thumbsUpCount: { type: Number, default: 0 },
  thumbsDownCount: { type: Number, default: 0 },
  alertSent: { type: Boolean, default: false },
  alertTicketId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportTicket' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now }
});

// ========================================
// 🎓 ADMISSION APPLICATION MODEL
// ========================================
// Purpose: Store admission applications submitted by students
const admissionApplicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  programId: { type: String, required: true },
  programName: { type: String, required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  dateOfBirth: { type: String, trim: true },
  address: { type: String, trim: true },
  previousEducation: { type: String, trim: true },
  status: {
    type: String,
    enum: ['submitted', 'under-review', 'accepted', 'rejected'],
    default: 'submitted'
  },
  submittedAt: { type: Date, default: Date.now }
});

// ========================================
// 📚 ACADEMIC REGISTRATION MODEL
// ========================================
// Purpose: Store course registration requests
const academicRegistrationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: String, required: true },
  courseCode: { type: String, required: true },
  courseName: { type: String, required: true },
  fullName: { type: String, required: true, trim: true },
  studentId: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  notes: { type: String, trim: true },
  status: { type: String, enum: ['submitted', 'approved', 'rejected'], default: 'submitted' },
  submittedAt: { type: Date, default: Date.now }
});

// ========================================
// 💰 FINANCIAL ASSISTANCE MODELS
// ========================================
// Purpose: Store scholarship applications and payment plan requests
const financialScholarshipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scholarshipId: { type: String, required: true },
  scholarshipName: { type: String, required: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  studentId: { type: String, required: true, trim: true },
  financialNeed: { type: String, trim: true },
  gpa: { type: String, trim: true },
  essay: { type: String, trim: true },
  status: { type: String, enum: ['submitted', 'reviewing', 'approved', 'rejected'], default: 'submitted' },
  submittedAt: { type: Date, default: Date.now }
});

const financialPaymentPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: String, required: true },
  planName: { type: String, required: true },
  fullName: { type: String, required: true, trim: true },
  studentId: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  paymentMethod: { type: String, trim: true },
  status: { type: String, enum: ['submitted', 'approved', 'rejected'], default: 'submitted' },
  submittedAt: { type: Date, default: Date.now }
});

// ========================================
// 🏫 CAMPUS SUPPORT MODELS
// ========================================
// Purpose: Store hostel applications and map requests
const campusHostelApplicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hostelId: { type: String, required: true },
  hostelName: { type: String, required: true },
  fullName: { type: String, required: true, trim: true },
  studentId: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  moveInDate: { type: String, trim: true },
  notes: { type: String, trim: true },
  status: { type: String, enum: ['submitted', 'approved', 'rejected'], default: 'submitted' },
  submittedAt: { type: Date, default: Date.now }
});

const campusMapRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestType: { type: String, enum: ['find', 'directions', 'wifi'], required: true },
  query: { type: String, trim: true },
  fromLocation: { type: String, trim: true },
  toLocation: { type: String, trim: true },
  status: { type: String, enum: ['submitted', 'completed', 'rejected'], default: 'submitted' },
  submittedAt: { type: Date, default: Date.now }
});

// ========================================
// 🧠 MENTAL HEALTH SUPPORT MODELS
// ========================================
// Purpose: Store appointment, group, and resource requests
const mentalHealthAppointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  counselorId: { type: String, required: true },
  counselorName: { type: String, required: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  preferredDate: { type: String, required: true, trim: true },
  concerns: { type: String, trim: true },
  status: { type: String, enum: ['submitted', 'scheduled', 'completed', 'cancelled'], default: 'submitted' },
  submittedAt: { type: Date, default: Date.now }
});

const mentalHealthGroupJoinSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  groupId: { type: String, required: true },
  groupName: { type: String, required: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  notes: { type: String, trim: true },
  status: { type: String, enum: ['submitted', 'approved', 'rejected'], default: 'submitted' },
  submittedAt: { type: Date, default: Date.now }
});

const mentalHealthResourceAccessSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resourceId: { type: String, required: true },
  resourceTitle: { type: String, required: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  status: { type: String, enum: ['submitted', 'approved', 'rejected'], default: 'submitted' },
  submittedAt: { type: Date, default: Date.now }
});

// ========================================
// 💼 CAREER SUPPORT MODELS
// ========================================
// Purpose: Store resume reviews and mock interview requests
const careerResumeReviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resumeTitle: { type: String, required: true, trim: true },
  targetRole: { type: String, required: true, trim: true },
  resumeLink: { type: String, trim: true },
  fullName: { type: String, required: true, trim: true },
  studentId: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  notes: { type: String, trim: true },
  status: { type: String, enum: ['submitted', 'reviewing', 'completed'], default: 'submitted' },
  submittedAt: { type: Date, default: Date.now }
});

const careerMockInterviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true, trim: true },
  preferredDate: { type: String, required: true, trim: true },
  experienceLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
  fullName: { type: String, required: true, trim: true },
  studentId: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  notes: { type: String, trim: true },
  status: { type: String, enum: ['submitted', 'scheduled', 'completed', 'cancelled'], default: 'submitted' },
  submittedAt: { type: Date, default: Date.now }
});

// ========================================
// 🏭 INDEXES FOR PERFORMANCE
// ========================================
// Indexes improve database query performance
userSchema.index({ studentId: 1 });
chatMessageSchema.index({ userId: 1, timestamp: -1 });
chatMessageSchema.index({ category: 1 });
faqSchema.index({ category: 1 });
faqSchema.index({ keywords: 1 });
moduleSchema.index({ moduleId: 1 });
socialPostSchema.index({ userId: 1, createdAt: -1 });
supportTicketSchema.index({ userId: 1, status: 1 });
supportTicketSchema.index({ source: 1, status: 1, submittedAt: -1 });
supportTicketSchema.index({ category: 1, priority: 1 });
chatResponseFeedbackSchema.index({ userId: 1, responseId: 1 }, { unique: true });
chatResponseFeedbackSchema.index({ normalizedQuestion: 1, vote: 1, updatedAt: -1 });
chatFeedbackSummarySchema.index({ thumbsDownCount: -1, updatedAt: -1 });
admissionApplicationSchema.index({ userId: 1, submittedAt: -1 });
academicRegistrationSchema.index({ userId: 1, submittedAt: -1 });
financialScholarshipSchema.index({ userId: 1, submittedAt: -1 });
financialPaymentPlanSchema.index({ userId: 1, submittedAt: -1 });
campusHostelApplicationSchema.index({ userId: 1, submittedAt: -1 });
campusMapRequestSchema.index({ userId: 1, submittedAt: -1 });
mentalHealthAppointmentSchema.index({ userId: 1, submittedAt: -1 });
mentalHealthGroupJoinSchema.index({ userId: 1, submittedAt: -1 });
mentalHealthResourceAccessSchema.index({ userId: 1, submittedAt: -1 });
careerResumeReviewSchema.index({ userId: 1, submittedAt: -1 });
careerMockInterviewSchema.index({ userId: 1, submittedAt: -1 });

// ========================================
// 📦 EXPORT MODELS
// ========================================
const User = mongoose.model('User', userSchema);
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
const Module = mongoose.model('Module', moduleSchema);
const FAQ = mongoose.model('FAQ', faqSchema);
const SocialPost = mongoose.model('SocialPost', socialPostSchema);
const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
const ChatResponseFeedback = mongoose.model('ChatResponseFeedback', chatResponseFeedbackSchema);
const ChatFeedbackSummary = mongoose.model('ChatFeedbackSummary', chatFeedbackSummarySchema);
const AdmissionApplication = mongoose.model('AdmissionApplication', admissionApplicationSchema);
const AcademicRegistration = mongoose.model('AcademicRegistration', academicRegistrationSchema);
const FinancialScholarshipApplication = mongoose.model('FinancialScholarshipApplication', financialScholarshipSchema);
const FinancialPaymentPlanRequest = mongoose.model('FinancialPaymentPlanRequest', financialPaymentPlanSchema);
const CampusHostelApplication = mongoose.model('CampusHostelApplication', campusHostelApplicationSchema);
const CampusMapRequest = mongoose.model('CampusMapRequest', campusMapRequestSchema);
const MentalHealthAppointment = mongoose.model('MentalHealthAppointment', mentalHealthAppointmentSchema);
const MentalHealthGroupJoin = mongoose.model('MentalHealthGroupJoin', mentalHealthGroupJoinSchema);
const MentalHealthResourceAccess = mongoose.model('MentalHealthResourceAccess', mentalHealthResourceAccessSchema);
const CareerResumeReviewRequest = mongoose.model('CareerResumeReviewRequest', careerResumeReviewSchema);
const CareerMockInterviewRequest = mongoose.model('CareerMockInterviewRequest', careerMockInterviewSchema);

module.exports = {
  User,
  ChatMessage,
  Module,
  FAQ,
  SocialPost,
  SupportTicket,
  ChatResponseFeedback,
  ChatFeedbackSummary,
  AdmissionApplication,
  AcademicRegistration,
  FinancialScholarshipApplication,
  FinancialPaymentPlanRequest,
  CampusHostelApplication,
  CampusMapRequest,
  MentalHealthAppointment,
  MentalHealthGroupJoin,
  MentalHealthResourceAccess,
  CareerResumeReviewRequest,
  CareerMockInterviewRequest
};
