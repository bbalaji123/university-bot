// ========================================
// BACKEND LESSON 4: AI Chat System
// ========================================

const express = require('express');
const { ChatMessage, User, SupportTicket, ChatResponseFeedback, ChatFeedbackSummary } = require('../models/User');
const { authenticateToken } = require('./auth');

const router = express.Router();

const FALLBACK_REPLY = 'Please contact university administration.';
const FEEDBACK_ALERT_THRESHOLD = 5;

const normalizeQuestionKey = (question = '') => {
  return String(question)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const POSITIVE_WORDS = [
  'happy', 'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love',
  'perfect', 'thank', 'thanks', 'awesome', 'brilliant', 'helpful', 'solved'
];

const NEGATIVE_WORDS = [
  'bad', 'terrible', 'awful', 'hate', 'worst', 'useless', 'stupid', 'frustrated',
  'angry', 'sad', 'depressed', 'anxious', 'worried', 'confused', 'lost', 'help',
  'problem', 'issue', 'error', 'fail'
];

// ========================================
// 🧠 AI RESPONSE GENERATION
// ========================================

// Sentiment Analysis Function
const analyzeSentiment = (text) => {
  const words = text.toLowerCase().split(/\s+/);
  let positiveScore = 0;
  let negativeScore = 0;
  
  words.forEach(word => {
    if (POSITIVE_WORDS.some(pw => word.includes(pw))) positiveScore++;
    if (NEGATIVE_WORDS.some(nw => word.includes(nw))) negativeScore++;
  });
  
  const totalScore = positiveScore + negativeScore;
  if (totalScore === 0) return { sentiment: 'neutral', confidence: 0.5 };
  
  const positiveRatio = positiveScore / totalScore;
  const confidence = Math.max(0.3, Math.min(0.9, totalScore / words.length * 2));
  
  if (positiveRatio > 0.6) return { sentiment: 'positive', confidence };
  if (positiveRatio < 0.4) return { sentiment: 'negative', confidence };
  return { sentiment: 'neutral', confidence };
};

// Smart Response Generation
const generateAIResponse = (userMessage, sentiment, chatHistory = []) => {
  const text = userMessage.toLowerCase();
  const startTime = Date.now();
  
  // Sentiment-aware responses
  if (sentiment.sentiment === 'negative' && sentiment.confidence > 0.6) {
    return {
      message: `I understand you're feeling frustrated. Let me help you resolve this issue right away. ${getStandardResponse(text)} If you need immediate assistance, you can also reach out to our human support team.`,
      category: 'support',
      responseTime: Date.now() - startTime
    };
  }
  
  if (sentiment.sentiment === 'positive' && sentiment.confidence > 0.6) {
    return {
      message: `I'm glad I could help! ${getStandardResponse(text)} Is there anything else I can assist you with today?`,
      category: 'followup',
      responseTime: Date.now() - startTime
    };
  }
  
  return {
    message: getStandardResponse(text),
    category: 'information',
    responseTime: Date.now() - startTime
  };
};

// Standard Response Logic
const getStandardResponse = (text) => {
  if (text.includes('admission') || text.includes('apply')) {
    return 'For admission assistance, I can help you with program information, eligibility requirements, and application tracking. Which specific area would you like to know about?';
  }
  if (text.includes('course') || text.includes('registration') || text.includes('academic')) {
    return 'For academic support, I can assist with course registration, credit requirements, and academic calendar information. What would you like to know?';
  }
  if (text.includes('fee') || text.includes('payment') || text.includes('scholarship') || text.includes('financial')) {
    return 'For financial assistance, I can provide information about fee payments, scholarships, and loan options. How can I help you with finances?';
  }
  if (text.includes('hostel') || text.includes('campus') || text.includes('transport') || text.includes('facility')) {
    return 'For campus support, I can help with hostel information, transportation schedules, and campus facilities. What do you need assistance with?';
  }
  if (text.includes('mental') || text.includes('counseling') || text.includes('stress') || text.includes('health')) {
    return 'For mental health support, I can connect you with counseling services, stress management resources, and support groups. How can I support your well-being?';
  }
  if (text.includes('career') || text.includes('internship') || text.includes('placement') || text.includes('resume') || text.includes('interview')) {
    return 'For career support, I can help with internships, resume reviews, mock interviews, and career events. What would you like to focus on?';
  }
  return 'I\'m here to help with admissions, academics, financial aid, campus services, mental health support, and career guidance. Could you please tell me more about what you need assistance with?';
};

// ========================================
// 💬 CHAT ROUTES
// ========================================

// POST /api/chat/send
// Send message and get AI response
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { message, language = 'en' } = req.body;
    const userId = req.userId;
    
    // Analyze sentiment
    const sentiment = analyzeSentiment(message);
    
    // Get chat history for context (last 10 messages)
    const chatHistory = await ChatMessage.find({ userId })
      .sort({ timestamp: -1 })
      .limit(10)
      .select('message sentiment timestamp');
    
    // Generate AI response
    const aiResponse = generateAIResponse(message, sentiment, chatHistory);
    
    // Save user message
    const userMessage = new ChatMessage({
      userId,
      message,
      sentiment: sentiment.sentiment,
      confidence: sentiment.confidence,
      category: 'user',
      isFromAI: false,
      language,
      timestamp: new Date()
    });
    
    await userMessage.save();
    
    // Save AI response
    const botMessage = new ChatMessage({
      userId,
      message: aiResponse.message,
      category: aiResponse.category,
      isFromAI: true,
      language,
      responseTime: aiResponse.responseTime,
      timestamp: new Date()
    });
    
    await botMessage.save();
    
    res.json({
      success: true,
      userMessage: {
        id: userMessage._id,
        message: userMessage.message,
        sentiment: userMessage.sentiment,
        confidence: userMessage.confidence,
        timestamp: userMessage.timestamp
      },
      aiResponse: {
        id: botMessage._id,
        message: botMessage.message,
        category: botMessage.category,
        responseTime: botMessage.responseTime,
        timestamp: botMessage.timestamp
      },
      sentiment: sentiment
    });
    
  } catch (error) {
    console.error('Chat send error:', error);
    res.status(500).json({
      error: 'Failed to send message',
      message: 'Server error'
    });
  }
});

// GET /api/chat/history
// Get user's chat history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, category } = req.query;
    const userId = req.userId;
    
    // Build query
    const query = { userId };
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Get messages with pagination
    const messages = await ChatMessage.find(query)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('message sentiment isFromAI category responseTime timestamp');
    
    // Get total count for pagination
    const total = await ChatMessage.countDocuments(query);
    
    res.json({
      messages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalMessages: total,
        hasNext: page * limit < total
      }
    });
    
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({
      error: 'Failed to fetch chat history',
      message: 'Server error'
    });
  }
});

// GET /api/chat/analytics
// Get chat analytics for user
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { timeframe = '7d' } = req.query; // 7d, 30d, 90d
    
    // Calculate date range
    const now = new Date();
    let startDate;
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    // Analytics data
    const [
      totalMessages,
      positiveMessages,
      negativeMessages,
      averageResponseTime,
      categoryBreakdown
    ] = await Promise.all([
      // Total messages
      ChatMessage.countDocuments({ 
        userId, 
        timestamp: { $gte: startDate, $lte: now } 
      }),
      
      // Positive messages
      ChatMessage.countDocuments({ 
        userId, 
        sentiment: 'positive',
        timestamp: { $gte: startDate, $lte: now } 
      }),
      
      // Negative messages
      ChatMessage.countDocuments({ 
        userId, 
        sentiment: 'negative',
        timestamp: { $gte: startDate, $lte: now } 
      }),
      
      // Average AI response time
      ChatMessage.aggregate([
        { $match: { userId, isFromAI: true, timestamp: { $gte: startDate, $lte: now } } },
        { $group: { _id: null, avgResponseTime: { $avg: '$responseTime' } } }
      ]),
      
      // Category breakdown
      ChatMessage.aggregate([
        { $match: { userId, timestamp: { $gte: startDate, $lte: now } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);
    
    const analytics = {
      timeframe,
      dateRange: {
        start: startDate,
        end: now
      },
      messages: {
        total: totalMessages,
        positive: positiveMessages,
        negative: negativeMessages,
        neutral: totalMessages - positiveMessages - negativeMessages
      },
      performance: {
        averageResponseTime: averageResponseTime[0]?.avgResponseTime || 0,
        totalAIResponses: await ChatMessage.countDocuments({ 
          userId, 
          isFromAI: true,
          timestamp: { $gte: startDate, $lte: now } 
        })
      },
      categories: categoryBreakdown
    };
    
    res.json(analytics);
    
  } catch (error) {
    console.error('Chat analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics',
      message: 'Server error'
    });
  }
});

// DELETE /api/chat/clear
// Clear chat history
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    const result = await ChatMessage.deleteMany({ userId });
    
    res.json({
      message: 'Chat history cleared successfully',
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error('Chat clear error:', error);
    res.status(500).json({
      error: 'Failed to clear chat history',
      message: 'Server error'
    });
  }
});

// POST /api/chat/escalations
// Submit unanswered chatbot question for admin review
router.post('/escalations', authenticateToken, async (req, res) => {
  try {
    const { question, language = 'en' } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        error: 'Question is required'
      });
    }

    const user = await User.findById(req.userId).select('role firstName lastName studentId');
    if (!user || user.role !== 'student') {
      return res.status(403).json({
        error: 'Only students can submit unanswered chatbot questions'
      });
    }

    const cleanedQuestion = question.trim();
    const ticket = await SupportTicket.create({
      userId: req.userId,
      subject: 'Unanswered chatbot question',
      description: cleanedQuestion,
      studentQuestion: cleanedQuestion,
      source: 'chatbot',
      language,
      category: 'technical',
      priority: 'medium',
      status: 'open',
      studentNotified: true,
      studentRead: false,
      messages: [
        {
          sender: req.userId,
          message: cleanedQuestion,
          isInternal: false,
          timestamp: new Date()
        }
      ]
    });

    res.status(201).json({
      message: 'Question submitted to admin. You will be notified when an answer is ready.',
      ticket: {
        id: ticket._id,
        question: ticket.studentQuestion,
        status: ticket.status,
        submittedAt: ticket.createdAt || ticket.submittedAt
      }
    });
  } catch (error) {
    console.error('Chat escalation submit error:', error);
    res.status(500).json({
      error: 'Failed to submit question',
      message: 'Server error'
    });
  }
});

// GET /api/chat/escalations/mine
// Fetch student chatbot escalations and answers
router.get('/escalations/mine', authenticateToken, async (req, res) => {
  try {
    const statusParam = String(req.query.status || 'all');
    const query = {
      userId: req.userId,
      source: 'chatbot'
    };

    if (statusParam === 'pending') {
      query.status = { $in: ['open', 'in-progress'] };
    } else if (statusParam === 'answered') {
      query.status = { $in: ['resolved', 'closed'] };
    }

    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1, submittedAt: -1 })
      .select('studentQuestion status adminAnswer answeredAt studentNotified studentRead createdAt submittedAt');

    res.json({
      escalations: tickets.map((ticket) => ({
        id: ticket._id,
        question: ticket.studentQuestion || ticket.description,
        status: ticket.status,
        answer: ticket.adminAnswer || '',
        answeredAt: ticket.answeredAt,
        submittedAt: ticket.createdAt || ticket.submittedAt,
        studentNotified: Boolean(ticket.studentNotified),
        studentRead: Boolean(ticket.studentRead)
      }))
    });
  } catch (error) {
    console.error('Chat escalation fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch escalations',
      message: 'Server error'
    });
  }
});

// GET /api/chat/escalations/notifications
// Return unread answer notifications for student
router.get('/escalations/notifications', authenticateToken, async (req, res) => {
  try {
    const unreadCount = await SupportTicket.countDocuments({
      userId: req.userId,
      source: 'chatbot',
      status: { $in: ['resolved', 'closed'] },
      studentRead: false,
      adminAnswer: { $exists: true, $ne: '' }
    });

    res.json({
      unreadCount
    });
  } catch (error) {
    console.error('Chat escalation notifications error:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications',
      message: 'Server error'
    });
  }
});

// PATCH /api/chat/escalations/:id/read
// Mark answered ticket as read by student
router.patch('/escalations/:id/read', authenticateToken, async (req, res) => {
  try {
    const updated = await SupportTicket.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.userId,
        source: 'chatbot'
      },
      {
        studentRead: true
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        error: 'Escalation not found'
      });
    }

    res.json({
      message: 'Notification acknowledged'
    });
  } catch (error) {
    console.error('Chat escalation read error:', error);
    res.status(500).json({
      error: 'Failed to update notification',
      message: 'Server error'
    });
  }
});

// GET /api/chat/escalations/published-faqs
// Return unique, admin-answered chatbot questions for FAQ display
router.get('/escalations/published-faqs', authenticateToken, async (req, res) => {
  try {
    const answeredTickets = await SupportTicket.find({
      source: 'chatbot',
      status: { $in: ['resolved', 'closed'] },
      adminAnswer: { $exists: true, $ne: '' }
    })
      .sort({ answeredAt: -1, updatedAt: -1, createdAt: -1 })
      .select('studentQuestion description adminAnswer answeredAt updatedAt createdAt');

    const seenQuestions = new Set();
    const publishedFaqs = [];

    answeredTickets.forEach((ticket) => {
      const question = String(ticket.studentQuestion || ticket.description || '').trim();
      const answer = String(ticket.adminAnswer || '').trim();

      if (!question || !answer) {
        return;
      }

      const normalizedQuestion = question.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seenQuestions.has(normalizedQuestion)) {
        return;
      }

      seenQuestions.add(normalizedQuestion);
      publishedFaqs.push({
        id: ticket._id,
        question,
        answer,
        answeredAt: ticket.answeredAt || ticket.updatedAt || ticket.createdAt
      });
    });

    res.json({
      faqs: publishedFaqs
    });
  } catch (error) {
    console.error('Published chatbot FAQ fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch published FAQs',
      message: 'Server error'
    });
  }
});

// POST /api/chat/feedback
// Capture 👍/👎 feedback for bot responses and raise admin alert after repeated 👎
router.post('/feedback', authenticateToken, async (req, res) => {
  try {
    const {
      responseId,
      question,
      reply,
      vote,
      language = 'en'
    } = req.body;

    if (!responseId || !String(responseId).trim()) {
      return res.status(400).json({ error: 'responseId is required' });
    }

    if (!question || !String(question).trim()) {
      return res.status(400).json({ error: 'question is required' });
    }

    if (!reply || !String(reply).trim()) {
      return res.status(400).json({ error: 'reply is required' });
    }

    if (!['up', 'down'].includes(String(vote || '').trim())) {
      return res.status(400).json({ error: 'vote must be up or down' });
    }

    const normalizedQuestion = normalizeQuestionKey(question);
    if (!normalizedQuestion) {
      return res.status(400).json({ error: 'question is invalid' });
    }

    const now = new Date();
    const nextVote = String(vote).trim();

    const existingFeedback = await ChatResponseFeedback.findOne({
      userId: req.userId,
      responseId: String(responseId).trim()
    });

    let previousVote = null;
    if (!existingFeedback) {
      await ChatResponseFeedback.create({
        userId: req.userId,
        responseId: String(responseId).trim(),
        question: String(question).trim(),
        normalizedQuestion,
        reply: String(reply).trim(),
        vote: nextVote,
        language,
        createdAt: now,
        updatedAt: now
      });
    } else {
      previousVote = existingFeedback.vote;
      existingFeedback.question = String(question).trim();
      existingFeedback.normalizedQuestion = normalizedQuestion;
      existingFeedback.reply = String(reply).trim();
      existingFeedback.vote = nextVote;
      existingFeedback.language = language;
      existingFeedback.updatedAt = now;
      await existingFeedback.save();
    }

    let summary = await ChatFeedbackSummary.findOne({ normalizedQuestion });
    if (!summary) {
      summary = await ChatFeedbackSummary.create({
        normalizedQuestion,
        sampleQuestion: String(question).trim(),
        sampleReply: String(reply).trim(),
        thumbsUpCount: 0,
        thumbsDownCount: 0,
        alertSent: false,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now
      });
    }

    if (previousVote === 'up') {
      summary.thumbsUpCount = Math.max(0, Number(summary.thumbsUpCount || 0) - 1);
    }
    if (previousVote === 'down') {
      summary.thumbsDownCount = Math.max(0, Number(summary.thumbsDownCount || 0) - 1);
    }

    if (nextVote === 'up') {
      summary.thumbsUpCount = Number(summary.thumbsUpCount || 0) + 1;
    } else {
      summary.thumbsDownCount = Number(summary.thumbsDownCount || 0) + 1;
    }

    summary.sampleQuestion = String(question).trim();
    summary.sampleReply = String(reply).trim();
    summary.updatedAt = now;
    summary.lastSeenAt = now;

    let alertRaised = false;
    if (summary.thumbsDownCount > FEEDBACK_ALERT_THRESHOLD && !summary.alertSent) {
      const alertTicket = await SupportTicket.create({
        userId: req.userId,
        subject: 'Chatbot answer needs review (repeated downvotes)',
        description:
          `Question: ${summary.sampleQuestion}\n` +
          `Thumbs down: ${summary.thumbsDownCount}\n` +
          `Thumbs up: ${summary.thumbsUpCount}\n` +
          `Latest answer sample: ${summary.sampleReply}`,
        source: 'chatbot',
        studentQuestion: summary.sampleQuestion,
        language,
        category: 'technical',
        priority: 'high',
        status: 'open',
        studentNotified: false,
        studentRead: true,
        messages: [
          {
            sender: req.userId,
            message:
              `Auto-alert: question crossed ${FEEDBACK_ALERT_THRESHOLD} downvotes. ` +
              `Please review dataset answer quality for this question intent.`,
            isInternal: true,
            timestamp: now
          }
        ]
      });

      summary.alertSent = true;
      summary.alertTicketId = alertTicket._id;
      alertRaised = true;
    }

    await summary.save();

    res.status(200).json({
      message: 'Feedback recorded',
      feedback: {
        responseId: String(responseId).trim(),
        vote: nextVote,
        previousVote,
        normalizedQuestion
      },
      summary: {
        thumbsUpCount: summary.thumbsUpCount,
        thumbsDownCount: summary.thumbsDownCount,
        alertSent: summary.alertSent,
        alertRaised
      }
    });
  } catch (error) {
    console.error('Chat feedback error:', error);
    res.status(500).json({
      error: 'Failed to record feedback',
      message: 'Server error'
    });
  }
});

module.exports = router;
