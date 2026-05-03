import React, { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import EmailRoundedIcon from '@mui/icons-material/EmailRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

interface UserProfile {
  id?: string
  firstName: string
  lastName: string
  email?: string
  studentId: string
  program: string
  year: number
  gpa?: number
  createdAt?: string
}

interface ProfileEditForm {
  firstName: string
  lastName: string
  email: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'

const Profile: React.FC = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editForm, setEditForm] = useState<ProfileEditForm>({
    firstName: '',
    lastName: '',
    email: '',
  })

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')

      if (!token || !userData) {
        navigate('/login')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to load profile')
        }

        const payload = await response.json()
        const profileUser = payload?.user as UserProfile
        setUser(profileUser)
        setEditForm({
          firstName: profileUser?.firstName || '',
          lastName: profileUser?.lastName || '',
          email: profileUser?.email || '',
        })

        const existing = JSON.parse(userData)
        localStorage.setItem('user', JSON.stringify({ ...existing, ...profileUser }))
      } catch {
        try {
          const fallbackUser = JSON.parse(userData)
          setUser(fallbackUser)
          setEditForm({
            firstName: fallbackUser?.firstName || '',
            lastName: fallbackUser?.lastName || '',
            email: fallbackUser?.email || '',
          })
        } catch {
          navigate('/login')
        }
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [navigate])

  const handleEditToggle = () => {
    if (!user) return

    if (editing) {
      setEditForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      })
      setError('')
      setSuccess('')
      setEditing(false)
      return
    }

    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
    })
    setError('')
    setSuccess('')
    setEditing(true)
  }

  const handleEditInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
    setError('')
    setSuccess('')
  }

  const handleSaveProfile = async () => {
    if (!user) return

    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      setError('First name and last name are required')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: editForm.firstName.trim(),
          lastName: editForm.lastName.trim(),
          email: editForm.email.trim() || undefined,
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || payload?.message || 'Failed to update profile')
      }

      const updatedUser = payload?.user as UserProfile
      setUser((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser))
      setEditForm({
        firstName: updatedUser?.firstName || '',
        lastName: updatedUser?.lastName || '',
        email: updatedUser?.email || '',
      })
      setSuccess(payload?.message || 'Profile updated successfully')
      setEditing(false)

      const existingUserRaw = localStorage.getItem('user')
      if (existingUserRaw) {
        const existingUser = JSON.parse(existingUserRaw)
        localStorage.setItem('user', JSON.stringify({ ...existingUser, ...updatedUser }))
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
        <Stack alignItems="center" spacing={1.2}>
          <CircularProgress />
          <Typography color="text.secondary">Loading profile...</Typography>
        </Stack>
      </Box>
    )
  }

  if (!user) {
    return null
  }

  return (
    <Stack spacing={2.5}>
      <Box>
        <Button component={RouterLink} to="/" startIcon={<ArrowBackRoundedIcon />}>
          Back to Home
        </Button>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" spacing={1.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                <PersonRoundedIcon />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: 28, md: 34 } }}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography color="text.secondary">Student Profile</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<EditRoundedIcon />} onClick={handleEditToggle}>
                {editing ? 'Cancel Edit' : 'Edit Profile'}
              </Button>
              {editing && (
                <Button variant="contained" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
              <Button variant="outlined" color="error" startIcon={<LogoutRoundedIcon />} onClick={handleLogout}>
                Logout
              </Button>
            </Stack>
          </Stack>

          {(error || success) && (
            <Box sx={{ mt: 2 }}>
              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">{success}</Alert>}
            </Box>
          )}
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 2 }}>
        <Stack spacing={2}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.6 }}>
                Basic Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                {editing ? (
                  <TextField
                    label="First Name"
                    name="firstName"
                    value={editForm.firstName}
                    onChange={handleEditInput}
                    fullWidth
                  />
                ) : (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonRoundedIcon fontSize="small" color="disabled" />
                    <Typography>{user.firstName}</Typography>
                  </Stack>
                )}

                {editing ? (
                  <TextField
                    label="Last Name"
                    name="lastName"
                    value={editForm.lastName}
                    onChange={handleEditInput}
                    fullWidth
                  />
                ) : (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonRoundedIcon fontSize="small" color="disabled" />
                    <Typography>{user.lastName}</Typography>
                  </Stack>
                )}

                {editing ? (
                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    value={editForm.email}
                    onChange={handleEditInput}
                    fullWidth
                  />
                ) : (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EmailRoundedIcon fontSize="small" color="disabled" />
                    <Typography>{user.email || 'Not specified'}</Typography>
                  </Stack>
                )}

                <Stack direction="row" spacing={1} alignItems="center">
                  <SchoolRoundedIcon fontSize="small" color="disabled" />
                  <Typography>{user.studentId}</Typography>
                </Stack>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.6 }}>
                Academic Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <MenuBookRoundedIcon fontSize="small" color="disabled" />
                  <Typography>{user.program}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CalendarMonthRoundedIcon fontSize="small" color="disabled" />
                  <Typography>Year {user.year}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <WorkspacePremiumRoundedIcon fontSize="small" color="disabled" />
                  <Typography>{user.gpa || 'Not specified'}</Typography>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Stack>

        <Stack spacing={2}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Quick Stats
              </Typography>
              <Divider sx={{ my: 1.4 }} />
              <Stack spacing={1.1}>
                <Typography variant="body2" color="text.secondary">
                  Member Since: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current Year: Year {user.year}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Program: {user.program}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Stack>
  )
}

export default Profile
