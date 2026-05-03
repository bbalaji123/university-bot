import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Chip,
} from '@mui/material'
import Modal from '../../components/Modal'

interface ModuleConfig {
  _id: string
  moduleId: string
  title: string
  description: string
  isActive: boolean
  visibility: 'students' | 'admins' | 'both'
  announcements?: Array<{ title: string; message: string; createdAt: string }>
}

const AdminModules: React.FC = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
  const location = useLocation()
  const statusFilter = useMemo(() => new URLSearchParams(location.search).get('status') || 'all', [location.search])

  const [modules, setModules] = useState<ModuleConfig[]>([])
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedModule, setSelectedModule] = useState<ModuleConfig | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    isActive: true,
    visibility: 'both' as ModuleConfig['visibility'],
  })
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
  })

  const loadModules = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setLoading(true)
      setError('')
      const response = await fetch(`${apiBaseUrl}/admin/modules`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to load modules')
      }

      const data = await response.json()
      setModules(data.modules || [])
    } catch {
      setError('Unable to load module configuration')
    } finally {
      setLoading(false)
    }
  }

  const loadPendingCounts = async (moduleList: ModuleConfig[]) => {
    const token = localStorage.getItem('token')
    if (!token) return

    const counts: Record<string, number> = {}
    await Promise.all(
      moduleList.map(async (module) => {
        try {
          const response = await fetch(`${apiBaseUrl}/admin/requests/${module.moduleId}?status=pending`, {
            headers: { Authorization: `Bearer ${token}` },
          })

          if (!response.ok) {
            counts[module.moduleId] = 0
            return
          }

          const data = await response.json()
          counts[module.moduleId] = (data.requests || []).length
        } catch {
          counts[module.moduleId] = 0
        }
      })
    )

    setPendingCounts(counts)
  }

  useEffect(() => {
    loadModules()
  }, [])

  useEffect(() => {
    if (modules.length) {
      loadPendingCounts(modules)
    }
  }, [modules])

  const openEditModal = (module: ModuleConfig) => {
    setSelectedModule(module)
    setEditForm({
      title: module.title,
      description: module.description,
      isActive: module.isActive,
      visibility: module.visibility,
    })
    setShowEditModal(true)
  }

  const openAnnouncementModal = (module: ModuleConfig) => {
    setSelectedModule(module)
    setAnnouncementForm({ title: '', message: '' })
    setShowAnnouncementModal(true)
  }

  const handleUpdateModule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedModule) return

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`${apiBaseUrl}/admin/modules/${selectedModule.moduleId}`, {
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
      setModules((prev) => prev.map((module) => (module.moduleId === selectedModule.moduleId ? data.module : module)))
      setShowEditModal(false)
    } catch {
      setError('Unable to update module settings')
    }
  }

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedModule) return

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`${apiBaseUrl}/admin/modules/${selectedModule.moduleId}/announcements`, {
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
      setModules((prev) => prev.map((module) => (module.moduleId === selectedModule.moduleId ? data.module : module)))
      setShowAnnouncementModal(false)
    } catch {
      setError('Unable to publish announcement')
    }
  }

  const filteredModules = statusFilter === 'pending'
    ? modules.filter((module) => (pendingCounts[module.moduleId] || 0) > 0)
    : modules

  return (
    <Stack spacing={2.3}>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" spacing={1.25}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Module Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Update module settings, publish announcements, and review pending requests.
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.8} alignItems="center">
          <SettingsRoundedIcon color="action" fontSize="small" />
          <Typography variant="caption" color="text.secondary">Admin tools</Typography>
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Typography variant="body2" color="text.secondary">Loading modules...</Typography>
      ) : (
        <Stack spacing={1.5}>
          {filteredModules.map((module) => (
            <Card key={module.moduleId} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {module.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {module.description}
                    </Typography>
                    <Stack direction="row" spacing={0.8} sx={{ mt: 1 }}>
                      <Chip label={module.isActive ? 'Active' : 'Paused'} color={module.isActive ? 'success' : 'default'} size="small" />
                      <Chip label={module.visibility} size="small" color="info" variant="outlined" />
                      <Chip label={`Pending: ${pendingCounts[module.moduleId] || 0}`} size="small" variant="outlined" />
                    </Stack>
                    <Stack direction="row" spacing={1.5} sx={{ mt: 1.2 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        {module.isActive ? <VisibilityRoundedIcon fontSize="small" /> : <VisibilityOffRoundedIcon fontSize="small" />}
                        <Typography variant="caption" color="text.secondary">{module.isActive ? 'Visible' : 'Hidden'}</Typography>
                      </Stack>
                    </Stack>
                  </Box>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Button variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => openEditModal(module)}>
                      Edit module
                    </Button>
                    <Button variant="outlined" startIcon={<CampaignRoundedIcon />} onClick={() => openAnnouncementModal(module)}>
                      Announcement
                    </Button>
                    <Button component={Link} to={`/admin/${module.moduleId}`} variant="contained" endIcon={<ArrowForwardRoundedIcon />}>
                      Review requests
                    </Button>
                  </Stack>
                </Stack>

                {module.announcements && module.announcements.length > 0 && (
                  <Box sx={{ mt: 1.4, p: 1.2, borderRadius: 2, bgcolor: 'action.hover' }}>
                    <Typography variant="caption" color="text.secondary">
                      Latest announcement: {module.announcements[module.announcements.length - 1].title}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {showEditModal && selectedModule && (
        <Modal title={`Edit ${selectedModule.title}`} onClose={() => setShowEditModal(false)}>
          <Stack component="form" spacing={1.4} onSubmit={handleUpdateModule}>
            <TextField
              label="Title"
              value={editForm.title}
              onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
              required
              fullWidth
              size="small"
            />
            <TextField
              label="Description"
              value={editForm.description}
              onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
              required
              fullWidth
              multiline
              minRows={3}
              size="small"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
              }
              label="Active for users"
            />
            <TextField
              select
              label="Visibility"
              value={editForm.visibility}
              onChange={(e) => setEditForm((prev) => ({ ...prev, visibility: e.target.value as ModuleConfig['visibility'] }))}
              fullWidth
              size="small"
            >
              <MenuItem value="both">Students and admins</MenuItem>
              <MenuItem value="students">Students only</MenuItem>
              <MenuItem value="admins">Admins only</MenuItem>
            </TextField>
            <Button type="submit" variant="contained">Save changes</Button>
          </Stack>
        </Modal>
      )}

      {showAnnouncementModal && selectedModule && (
        <Modal title={`Announcement for ${selectedModule.title}`} onClose={() => setShowAnnouncementModal(false)}>
          <Stack component="form" spacing={1.4} onSubmit={handlePublishAnnouncement}>
            <TextField
              label="Title"
              value={announcementForm.title}
              onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, title: e.target.value }))}
              required
              fullWidth
              size="small"
            />
            <TextField
              label="Message"
              value={announcementForm.message}
              onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, message: e.target.value }))}
              required
              multiline
              minRows={4}
              fullWidth
              size="small"
            />
            <Button type="submit" variant="contained">Publish announcement</Button>
          </Stack>
        </Modal>
      )}
    </Stack>
  )
}

export default AdminModules
