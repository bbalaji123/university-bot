import React, { useEffect, useMemo, useState } from 'react'
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

interface EscalationItem {
  id: string
  question: string
  status: string
  answer?: string
  answeredAt?: string
  submittedAt?: string
  studentRead?: boolean
}

const StudentQuestions: React.FC = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
  const [items, setItems] = useState<EscalationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [ackLoadingId, setAckLoadingId] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationMessage, setNotificationMessage] = useState('')

  const buildNotificationMessage = (count: number) => {
    if (count <= 0) return ''
    if (count === 1) return 'You have 1 new admin response to your escalated question.'
    return `You have ${count} new admin responses to your escalated questions.`
  }

  const loadItems = async (filter = statusFilter, silent = false) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      if (!silent) {
        setLoading(true)
        setError('')
      }
      const response = await fetch(`${apiBaseUrl}/chat/escalations/mine?status=${filter}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load escalated questions')
      }

      const payload = await response.json()
      setItems(payload.escalations || [])
    } catch {
      setError('Unable to load your escalated questions right now')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  const loadNotifications = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`${apiBaseUrl}/chat/escalations/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load notifications')
      }

      const payload = await response.json()
      const nextUnreadCount = Number(payload?.unreadCount || 0)
      setUnreadCount(nextUnreadCount)
      setNotificationMessage(buildNotificationMessage(nextUnreadCount))
    } catch {
      // Keep the page usable even if notification count fetch fails.
    }
  }

  useEffect(() => {
    void loadItems()
    void loadNotifications()

    const intervalId = window.setInterval(() => {
      void loadItems(statusFilter, true)
      void loadNotifications()
    }, 15000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [statusFilter])

  const acknowledgeAnswer = async (id: string) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setAckLoadingId(id)
      const response = await fetch(`${apiBaseUrl}/chat/escalations/${id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to acknowledge answer')
      }

      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, studentRead: true } : item)))
      setUnreadCount((prev) => {
        const next = Math.max(0, prev - 1)
        setNotificationMessage(buildNotificationMessage(next))
        return next
      })
    } catch {
      setError('Unable to acknowledge this answer right now')
    } finally {
      setAckLoadingId('')
    }
  }

  const counts = useMemo(
    () => ({
      total: items.length,
      pending: items.filter((item) => item.status === 'open' || item.status === 'in-progress').length,
      answered: items.filter((item) => item.status === 'resolved' || item.status === 'closed').length,
    }),
    [items]
  )

  const getStatusColor = (status: string) => {
    if (status === 'resolved' || status === 'closed') return 'success'
    if (status === 'in-progress') return 'warning'
    return 'default'
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          My Escalated Questions
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Track questions sent to admin and view verified answers with acknowledgment status.
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Chip label={`Total: ${counts.total}`} variant="outlined" />
        <Chip label={`Pending: ${counts.pending}`} color="warning" variant="outlined" />
        <Chip label={`Answered: ${counts.answered}`} color="success" variant="outlined" />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
        <TextField
          select
          size="small"
          value={statusFilter}
          sx={{ minWidth: 180 }}
          onChange={(event) => {
            const next = event.target.value
            setStatusFilter(next)
            void loadItems(next)
          }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="answered">Answered</MenuItem>
        </TextField>

        <Button variant="outlined" onClick={() => void loadItems(statusFilter)}>
          Refresh
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {notificationMessage && (
        <Alert severity="success" onClose={() => setNotificationMessage('')}>
          {notificationMessage}
          {unreadCount > 0 && (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
              Unread responses: {unreadCount}
            </Typography>
          )}
        </Alert>
      )}

      {loading ? (
        <Typography variant="body2" color="text.secondary">
          Loading your questions...
        </Typography>
      ) : (
        <Stack spacing={1.2}>
          {items.map((item) => (
            <Card key={item.id} variant="outlined">
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {item.question}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.4 }}>
                      Submitted {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : 'N/A'}
                    </Typography>
                    <Chip
                      label={item.status}
                      color={getStatusColor(item.status)}
                      size="small"
                      sx={{ mt: 0.9 }}
                    />
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    {item.answer ? (
                      <>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Admin Answer
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                          {item.answer}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.4 }}>
                          Answered {item.answeredAt ? new Date(item.answeredAt).toLocaleString() : 'N/A'}
                        </Typography>
                        {!item.studentRead && (
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ mt: 1 }}
                            disabled={ackLoadingId === item.id}
                            onClick={() => {
                              void acknowledgeAnswer(item.id)
                            }}
                          >
                            {ackLoadingId === item.id ? 'Acknowledging...' : 'Acknowledge'}
                          </Button>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Admin response is pending.
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}

          {!items.length && (
            <Typography variant="body2" color="text.secondary">
              No escalated questions found for the selected filter.
            </Typography>
          )}
        </Stack>
      )}
    </Stack>
  )
}

export default StudentQuestions
