import React, { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

interface AdminQuestionItem {
  id: string
  question: string
  status: string
  submittedAt?: string
  adminAnswer?: string
  answeredAt?: string
  student?: {
    firstName?: string
    lastName?: string
    studentId?: string
  } | null
}

const AdminChatbotQuestions: React.FC = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
  const [items, setItems] = useState<AdminQuestionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState('')

  const loadItems = async (filter = statusFilter) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setLoading(true)
      setError('')
      const response = await fetch(`${apiBaseUrl}/admin/chatbot-questions?status=${filter}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load chatbot questions')
      }

      const payload = await response.json()
      setItems(payload.questions || [])
    } catch {
      setError('Unable to load chatbot questions right now')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadItems()
  }, [])

  const publishAnswer = async (id: string) => {
    const token = localStorage.getItem('token')
    if (!token) return

    const answer = (drafts[id] || '').trim()
    if (!answer) {
      setError('Please write an answer before publishing')
      return
    }

    try {
      setSavingId(id)
      setError('')
      const response = await fetch(`${apiBaseUrl}/admin/chatbot-questions/${id}/answer`, {
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

      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'resolved',
                adminAnswer: answer,
                answeredAt: new Date().toISOString(),
              }
            : item
        )
      )
      setDrafts((prev) => ({ ...prev, [id]: '' }))
    } catch {
      setError('Unable to publish answer right now')
    } finally {
      setSavingId('')
    }
  }

  const getStatusColor = (status: string) => {
    if (status === 'resolved' || status === 'closed') return 'success'
    if (status === 'in-progress') return 'warning'
    return 'default'
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Chatbot Questions Queue
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Review unanswered chatbot requests, provide verified answers, and notify students.
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
        <TextField
          select
          size="small"
          value={statusFilter}
          sx={{ minWidth: 200 }}
          onChange={(event) => {
            const next = event.target.value
            setStatusFilter(next)
            void loadItems(next)
          }}
        >
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="answered">Answered</MenuItem>
          <MenuItem value="all">All</MenuItem>
        </TextField>

        <Button variant="outlined" onClick={() => void loadItems(statusFilter)}>
          Refresh
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Typography variant="body2" color="text.secondary">
          Loading chatbot questions...
        </Typography>
      ) : (
        <Stack spacing={1.2}>
          {items.map((item) => (
            <Card key={item.id} variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {item.question}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
                        Student: {item.student?.firstName || 'N/A'} {item.student?.lastName || ''} ({item.student?.studentId || 'N/A'})
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Submitted {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : 'N/A'}
                      </Typography>
                    </Box>
                    <Chip label={item.status} color={getStatusColor(item.status)} size="small" />
                  </Stack>

                  {(item.status === 'open' || item.status === 'in-progress') && (
                    <>
                      <TextField
                        multiline
                        minRows={2}
                        fullWidth
                        size="small"
                        placeholder="Write answer for student"
                        value={drafts[item.id] || ''}
                        onChange={(event) => {
                          setDrafts((prev) => ({ ...prev, [item.id]: event.target.value }))
                        }}
                      />
                      <Stack direction="row" justifyContent="flex-end">
                        <Button
                          variant="contained"
                          size="small"
                          disabled={savingId === item.id}
                          onClick={() => {
                            void publishAnswer(item.id)
                          }}
                        >
                          {savingId === item.id ? 'Publishing...' : 'Publish answer'}
                        </Button>
                      </Stack>
                    </>
                  )}

                  {item.adminAnswer && (
                    <Alert severity="success">
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Published Answer
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.4 }}>
                        {item.adminAnswer}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.4 }}>
                        Answered {item.answeredAt ? new Date(item.answeredAt).toLocaleString() : 'N/A'}
                      </Typography>
                    </Alert>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}

          {!items.length && (
            <Typography variant="body2" color="text.secondary">
              No chatbot questions found for this filter.
            </Typography>
          )}
        </Stack>
      )}
    </Stack>
  )
}

export default AdminChatbotQuestions
