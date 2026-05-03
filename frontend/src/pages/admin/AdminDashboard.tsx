import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import WorkRoundedIcon from '@mui/icons-material/WorkRounded'
import ShareRoundedIcon from '@mui/icons-material/ShareRounded'
import QuizRoundedIcon from '@mui/icons-material/QuizRounded'
import GroupRoundedIcon from '@mui/icons-material/GroupRounded'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Modal from '../../components/Modal'

const ADMIN_MODULES = [
  {
    id: 'admission',
    title: 'Admissions',
    description: 'Approve applications, update program info, and review eligibility data.',
    icon: SchoolRoundedIcon,
    accent: '#0369a1',
  },
  {
    id: 'academic',
    title: 'Academics',
    description: 'Manage course registrations, calendars, and academic resources.',
    icon: MenuBookRoundedIcon,
    accent: '#047857',
  },
  {
    id: 'financial',
    title: 'Financial Aid',
    description: 'Control scholarships, payment plans, and student financial requests.',
    icon: AccountBalanceWalletRoundedIcon,
    accent: '#b45309',
  },
  {
    id: 'campus',
    title: 'Campus Services',
    description: 'Oversee hostel applications, transport updates, and campus requests.',
    icon: ApartmentRoundedIcon,
    accent: '#7c3aed',
  },
  {
    id: 'mental-health',
    title: 'Wellbeing',
    description: 'Coordinate counseling requests and resource access approvals.',
    icon: FavoriteRoundedIcon,
    accent: '#be123c',
  },
  {
    id: 'career',
    title: 'Career Support',
    description: 'Track resume reviews, mock interviews, and internship pipelines.',
    icon: WorkRoundedIcon,
    accent: '#3730a3',
  },
  {
    id: 'social-media',
    title: 'Social Media',
    description: 'Schedule announcements and moderate student-facing posts.',
    icon: ShareRoundedIcon,
    accent: '#0369a1',
  },
  {
    id: 'ai-faqs',
    title: 'AI FAQs',
    description: 'Curate AI-generated FAQs and publish verified answers.',
    icon: QuizRoundedIcon,
    accent: '#334155',
  },
]

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
  const [showStudents, setShowStudents] = useState(false)
  const [showChatbotQuestions, setShowChatbotQuestions] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState('')
  const [chatbotQuestions, setChatbotQuestions] = useState<any[]>([])
  const [chatbotLoading, setChatbotLoading] = useState(false)
  const [chatbotError, setChatbotError] = useState('')
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({})
  const [answerSavingId, setAnswerSavingId] = useState('')

  const loadStudents = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setStudentsLoading(true)
      setStudentsError('')
      const response = await fetch(`${apiBaseUrl}/admin/students?status=active`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to load students')
      }

      const data = await response.json()
      setStudents(data.students || [])
    } catch {
      setStudentsError('Unable to load active students')
    } finally {
      setStudentsLoading(false)
    }
  }

  const openStudentsModal = () => {
    setShowStudents(true)
    loadStudents()
  }

  const loadChatbotQuestions = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setChatbotLoading(true)
      setChatbotError('')
      const response = await fetch(`${apiBaseUrl}/admin/chatbot-questions?status=pending`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to load chatbot questions')
      }

      const data = await response.json()
      setChatbotQuestions(data.questions || [])
    } catch {
      setChatbotError('Unable to load pending chatbot questions')
    } finally {
      setChatbotLoading(false)
    }
  }

  const openChatbotQuestionsModal = () => {
    setShowChatbotQuestions(true)
    loadChatbotQuestions()
  }

  const publishChatbotAnswer = async (questionId: string) => {
    const token = localStorage.getItem('token')
    if (!token) return

    const answer = (answerDrafts[questionId] || '').trim()
    if (!answer) {
      setChatbotError('Answer is required before publishing')
      return
    }

    try {
      setAnswerSavingId(questionId)
      setChatbotError('')
      const response = await fetch(`${apiBaseUrl}/admin/chatbot-questions/${questionId}/answer`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answer }),
      })

      if (!response.ok) {
        throw new Error('Failed to publish answer')
      }

      setAnswerDrafts((prev) => ({ ...prev, [questionId]: '' }))
      setChatbotQuestions((prev) => prev.filter((item) => item.id !== questionId))
    } catch {
      setChatbotError('Unable to publish answer right now')
    } finally {
      setAnswerSavingId('')
    }
  }

  const toggleStudentStatus = async (studentId: string, isActive: boolean) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`${apiBaseUrl}/admin/students/${studentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive }),
      })

      if (!response.ok) {
        throw new Error('Failed to update student')
      }

      setStudents((prev) => prev.map((student) => (student._id === studentId ? { ...student, isActive } : student)))
    } catch {
      setStudentsError('Unable to update student status')
    }
  }

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" spacing={1.5}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Admin Control Center
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
            Monitor student activity, approve requests, and manage every support module.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<GroupRoundedIcon />} onClick={openStudentsModal}>
            View active students
          </Button>
          <Button variant="outlined" onClick={openChatbotQuestionsModal}>
            Unanswered chatbot questions
          </Button>
          <Button variant="contained" startIcon={<FactCheckRoundedIcon />} onClick={() => navigate('/admin/modules?status=pending')}>
            Review pending approvals
          </Button>
        </Stack>
      </Stack>

      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Manage modules
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>
          Each module controls the data students see and the requests they submit.
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 2,
          }}
        >
          {ADMIN_MODULES.map((module) => {
            const Icon = module.icon
            return (
              <Card
                key={module.id}
                component={Link}
                to={`/admin/${module.id}`}
                sx={{
                  textDecoration: 'none',
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%',
                  transition: 'transform .2s ease, box-shadow .2s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Avatar sx={{ bgcolor: module.accent }}>
                      <Icon fontSize="small" />
                    </Avatar>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      OPEN
                    </Typography>
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 700, mt: 1.3 }}>
                    {module.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8 }}>
                    {module.description}
                  </Typography>
                </CardContent>
              </Card>
            )
          })}
        </Box>
      </Box>

      {showStudents && (
        <Modal title="Active students" onClose={() => setShowStudents(false)}>
          {studentsError && <Alert severity="error" sx={{ mb: 1.2 }}>{studentsError}</Alert>}
          {studentsLoading ? (
            <Typography variant="body2" color="text.secondary">Loading students...</Typography>
          ) : (
            <Stack spacing={1}>
              {students.map((student) => (
                <Card key={student._id} variant="outlined">
                  <CardContent sx={{ py: 1.2, '&:last-child': { pb: 1.2 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {student.firstName} {student.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {student.studentId} • {student.program}
                        </Typography>
                      </Box>
                      <Button size="small" variant="outlined" onClick={() => toggleStudentStatus(student._id, !student.isActive)}>
                        {student.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
              {!students.length && <Typography variant="body2" color="text.secondary">No active students found.</Typography>}
            </Stack>
          )}
        </Modal>
      )}

      {showChatbotQuestions && (
        <Modal title="Unanswered chatbot questions" onClose={() => setShowChatbotQuestions(false)}>
          {chatbotError && <Alert severity="error" sx={{ mb: 1.2 }}>{chatbotError}</Alert>}
          {chatbotLoading ? (
            <Typography variant="body2" color="text.secondary">Loading questions...</Typography>
          ) : (
            <Stack spacing={1.2}>
              {chatbotQuestions.map((item) => (
                <Card key={item.id} variant="outlined">
                  <CardContent sx={{ py: 1.4, '&:last-child': { pb: 1.4 } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {item.student ? `${item.student.firstName} ${item.student.lastName}` : 'Student'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.8 }}>
                      {item.student?.studentId || 'N/A'} • {new Date(item.submittedAt).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {item.question}
                    </Typography>
                    <Divider sx={{ mb: 1 }} />
                    <TextField
                      multiline
                      minRows={2}
                      fullWidth
                      size="small"
                      placeholder="Write the answer for student"
                      value={answerDrafts[item.id] || ''}
                      onChange={(e) => setAnswerDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    />
                    <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => publishChatbotAnswer(item.id)}
                        disabled={answerSavingId === item.id}
                      >
                        {answerSavingId === item.id ? 'Publishing...' : 'Publish answer'}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
              {!chatbotQuestions.length && (
                <Typography variant="body2" color="text.secondary">
                  No unanswered chatbot questions right now.
                </Typography>
              )}
            </Stack>
          )}
        </Modal>
      )}
    </Stack>
  )
}

export default AdminDashboard
