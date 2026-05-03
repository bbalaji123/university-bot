import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import WorkRoundedIcon from '@mui/icons-material/WorkRounded'
import ShareRoundedIcon from '@mui/icons-material/ShareRounded'
import QuizRoundedIcon from '@mui/icons-material/QuizRounded'
import RuleRoundedIcon from '@mui/icons-material/RuleRounded'
import TableChartRoundedIcon from '@mui/icons-material/TableChartRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Divider,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import Modal from '../../components/Modal'

const MODULE_CONFIG: Record<string, { title: string; description: string; icon: React.ElementType }> = {
  admission: {
    title: 'Admissions Module',
    description: 'Review applications, set eligibility rules, and publish program updates.',
    icon: SchoolRoundedIcon,
  },
  academic: {
    title: 'Academic Module',
    description: 'Approve course registrations and maintain academic calendars.',
    icon: MenuBookRoundedIcon,
  },
  financial: {
    title: 'Financial Module',
    description: 'Approve scholarships, payment plans, and fee adjustments.',
    icon: AccountBalanceWalletRoundedIcon,
  },
  campus: {
    title: 'Campus Module',
    description: 'Manage hostel requests, transportation updates, and campus services.',
    icon: ApartmentRoundedIcon,
  },
  'mental-health': {
    title: 'Mental Health Module',
    description: 'Handle counseling appointments and wellbeing resource access.',
    icon: FavoriteRoundedIcon,
  },
  career: {
    title: 'Career Module',
    description: 'Review resume feedback requests and mock interview bookings.',
    icon: WorkRoundedIcon,
  },
  'social-media': {
    title: 'Social Media Module',
    description: 'Schedule announcements and moderate student-facing content.',
    icon: ShareRoundedIcon,
  },
  'ai-faqs': {
    title: 'AI FAQs Module',
    description: 'Approve AI-generated answers before students see them.',
    icon: QuizRoundedIcon,
  },
}

const STATUS_OPTIONS: Record<string, string[]> = {
  admission: ['submitted', 'under-review', 'accepted', 'rejected'],
  academic: ['submitted', 'approved', 'rejected'],
  'financial-scholarship': ['submitted', 'reviewing', 'approved', 'rejected'],
  'financial-payment': ['submitted', 'approved', 'rejected'],
  'campus-hostel': ['submitted', 'approved', 'rejected'],
  'campus-map': ['submitted', 'completed', 'rejected'],
  'mental-appointment': ['submitted', 'scheduled', 'completed', 'cancelled'],
  'mental-group': ['submitted', 'approved', 'rejected'],
  'mental-resource': ['submitted', 'approved', 'rejected'],
  'career-resume': ['submitted', 'reviewing', 'completed'],
  'career-mock': ['submitted', 'scheduled', 'completed', 'cancelled'],
}

interface ModuleDetails {
  title: string
  description: string
  isActive?: boolean
  visibility?: string
  announcements?: Array<{ title: string; message: string; createdAt: string }>
}

interface ModuleRequest {
  id: string
  collection: string
  title: string
  subtitle: string
  status: string
  submittedAt: string
  details: Record<string, string>
}

const AdminModule: React.FC = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
  const { moduleId } = useParams()
  const config = moduleId ? MODULE_CONFIG[moduleId] : null
  const requestSectionRef = useRef<HTMLDivElement>(null)

  const [moduleDetails, setModuleDetails] = useState<ModuleDetails | null>(null)
  const [requests, setRequests] = useState<ModuleRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    isActive: true,
    visibility: 'both',
  })
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
  })

  const Icon = config?.icon

  const fetchModuleDetails = async () => {
    if (!moduleId) return
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`${apiBaseUrl}/admin/modules/${moduleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch module details')
      }

      const data = await response.json()
      setModuleDetails(data.module)
      setEditForm({
        title: data.module.title,
        description: data.module.description,
        isActive: data.module.isActive,
        visibility: data.module.visibility,
      })
    } catch {
      setError('Unable to load module details')
    }
  }

  const fetchRequests = async (statusValue = statusFilter) => {
    if (!moduleId) return
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setLoading(true)
      setError('')
      const response = await fetch(`${apiBaseUrl}/admin/requests/${moduleId}?status=${statusValue}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch requests')
      }

      const data = await response.json()
      setRequests(data.requests || [])
    } catch {
      setError('Unable to load module requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModuleDetails()
    fetchRequests()
  }, [moduleId])

  const handleExport = () => {
    if (!requests.length) return

    const header = ['Title', 'Subtitle', 'Status', 'Submitted At', 'Collection']
    const rows = requests.map((request) => [
      request.title,
      request.subtitle,
      request.status,
      new Date(request.submittedAt).toLocaleString(),
      request.collection,
    ])

    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${moduleId}-requests.csv`
    link.click()
  }

  const handleReviewRequests = () => {
    setStatusFilter('pending')
    fetchRequests('pending')
    requestSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleUpdateStatus = async (request: ModuleRequest, status: string) => {
    const token = localStorage.getItem('token')
    if (!token || !moduleId) return

    try {
      const response = await fetch(`${apiBaseUrl}/admin/requests/${moduleId}/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          collection: request.collection,
          status,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      setRequests((prev) => prev.map((item) => (item.id === request.id ? { ...item, status } : item)))
    } catch {
      setError('Unable to update request status')
    }
  }

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!moduleId) return
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`${apiBaseUrl}/admin/modules/${moduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        throw new Error('Failed to update module')
      }

      const data = await response.json()
      setModuleDetails(data.module)
      setShowEditModal(false)
    } catch {
      setError('Unable to update module settings')
    }
  }

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!moduleId) return
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`${apiBaseUrl}/admin/modules/${moduleId}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(announcementForm),
      })

      if (!response.ok) {
        throw new Error('Failed to publish announcement')
      }

      const data = await response.json()
      setModuleDetails(data.module)
      setAnnouncementForm({ title: '', message: '' })
      setShowAnnouncementModal(false)
    } catch {
      setError('Unable to publish announcement')
    }
  }

  const statusOptionsForRequest = useMemo(() => {
    const mapping: Record<string, string[]> = { ...STATUS_OPTIONS }
    if (moduleId && mapping[moduleId]) {
      return mapping[moduleId]
    }
    return []
  }, [moduleId])

  if (!config) {
    return (
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">Module not found.</Typography>
          <Button component={Link} to="/admin" startIcon={<ArrowBackRoundedIcon />} sx={{ mt: 1 }}>
            Back to admin dashboard
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Stack spacing={2.2}>
      <Button component={Link} to="/admin/modules" startIcon={<ArrowBackRoundedIcon />} sx={{ width: 'fit-content' }}>
        Back to modules
      </Button>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5}>
            <Stack direction="row" spacing={1.3}>
              <Avatar sx={{ bgcolor: 'text.primary' }}>{Icon && <Icon fontSize="small" />}</Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {moduleDetails?.title || config.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                  {moduleDetails?.description || config.description}
                </Typography>
                {moduleDetails && (
                  <Stack direction="row" spacing={0.8} sx={{ mt: 0.9 }}>
                    <Chip label={moduleDetails.isActive ? 'Active' : 'Paused'} size="small" color={moduleDetails.isActive ? 'success' : 'default'} />
                    <Chip label={moduleDetails.visibility} size="small" color="info" variant="outlined" />
                  </Stack>
                )}
              </Box>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant="outlined" startIcon={<TableChartRoundedIcon />} onClick={handleExport}>
                Export data
              </Button>
              <Button variant="contained" startIcon={<RuleRoundedIcon />} onClick={handleReviewRequests}>
                Review requests
              </Button>
              <Button variant="outlined" startIcon={<SettingsRoundedIcon />} onClick={() => setShowEditModal(true)}>
                Edit module
              </Button>
              <Button variant="outlined" startIcon={<CampaignRoundedIcon />} onClick={() => setShowAnnouncementModal(true)}>
                Announcement
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error">{error}</Alert>}

      <Box ref={requestSectionRef}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} sx={{ mb: 1.2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Pending student requests</Typography>
          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              fetchRequests(e.target.value)
            }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="all">All statuses</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </TextField>
        </Stack>

        {loading ? (
          <Typography variant="body2" color="text.secondary">Loading requests...</Typography>
        ) : (
          <Stack spacing={1.5}>
            {requests.map((request) => {
              const options = STATUS_OPTIONS[request.collection] || statusOptionsForRequest
              return (
                <Box key={request.id}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {request.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {request.subtitle}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            Submitted {new Date(request.submittedAt).toLocaleString()} • {request.collection}
                          </Typography>

                          <Stack direction="row" flexWrap="wrap" gap={0.7} sx={{ mt: 0.8 }}>
                            {Object.entries(request.details || {}).slice(0, 5).map(([key, value]) => (
                              <Chip key={key} label={`${key}: ${value}`} size="small" variant="outlined" />
                            ))}
                          </Stack>
                        </Box>

                        <Stack spacing={0.9} sx={{ minWidth: 170 }}>
                          <Chip label={request.status} size="small" color="info" />
                          <TextField
                            select
                            size="small"
                            value={request.status}
                            onChange={(e) => handleUpdateStatus(request, e.target.value)}
                          >
                            {[...new Set(options.length ? options : ['pending', 'approved', 'rejected'])].map((option) => (
                              <MenuItem key={option} value={option}>
                                {option}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              )
            })}
          </Stack>
        )}

        {!loading && !requests.length && (
          <Card elevation={0} sx={{ border: '1px dashed', borderColor: 'divider', mt: 1.3 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">No requests found for the selected filter.</Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      {showEditModal && (
        <Modal title="Update module settings" onClose={() => setShowEditModal(false)}>
          <Stack component="form" spacing={1.4} onSubmit={handleSaveModule}>
            <TextField
              label="Title"
              value={editForm.title}
              onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
              fullWidth
              required
              size="small"
            />
            <TextField
              label="Description"
              value={editForm.description}
              onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              minRows={3}
              required
              size="small"
            />
            <FormControlLabel
              control={<Checkbox checked={editForm.isActive} onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))} />}
              label="Active for users"
            />
            <TextField
              select
              label="Visibility"
              value={editForm.visibility}
              onChange={(e) => setEditForm((prev) => ({ ...prev, visibility: e.target.value }))}
              size="small"
              fullWidth
            >
              <MenuItem value="both">Students and admins</MenuItem>
              <MenuItem value="students">Students only</MenuItem>
              <MenuItem value="admins">Admins only</MenuItem>
            </TextField>
            <Button type="submit" variant="contained">Save settings</Button>
          </Stack>
        </Modal>
      )}

      {showAnnouncementModal && (
        <Modal title="Publish announcement" onClose={() => setShowAnnouncementModal(false)}>
          <Stack component="form" spacing={1.4} onSubmit={handlePublishAnnouncement}>
            <TextField
              label="Announcement title"
              value={announcementForm.title}
              onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, title: e.target.value }))}
              fullWidth
              required
              size="small"
            />
            <TextField
              label="Announcement message"
              value={announcementForm.message}
              onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, message: e.target.value }))}
              multiline
              minRows={4}
              fullWidth
              required
              size="small"
            />
            <Button type="submit" variant="contained">Publish</Button>
          </Stack>
          {!!moduleDetails?.announcements?.length && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ mb: 1 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Recent announcements</Typography>
              <Stack spacing={0.8}>
                {moduleDetails.announcements.slice(-3).reverse().map((item) => (
                  <Card key={`${item.title}-${item.createdAt}`} variant="outlined">
                    <CardContent sx={{ py: 1.2, '&:last-child': { pb: 1.2 } }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{item.message}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}
        </Modal>
      )}
    </Stack>
  )
}

export default AdminModule
