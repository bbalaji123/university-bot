import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import WorkRoundedIcon from '@mui/icons-material/WorkRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import MicRoundedIcon from '@mui/icons-material/MicRounded'
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material'

const MODULES = [
  {
    title: 'Admission Assistance',
    description: 'Program information, eligibility checks, and application tracking',
    icon: SchoolRoundedIcon,
    href: '/admission',
    color: '#0369a1',
    features: ['Program Information', 'Eligibility Checks', 'Application Tracking'],
  },
  {
    title: 'Academic Support',
    description: 'Course registration guidance, credit requirements, and academic calendar',
    icon: MenuBookRoundedIcon,
    href: '/academic',
    color: '#047857',
    features: ['Course Registration', 'Credit Requirements', 'Academic Calendar'],
  },
  {
    title: 'Financial Assistance',
    description: 'Fee payment information, scholarship guidance, and loan assistance',
    icon: AccountBalanceWalletRoundedIcon,
    href: '/financial',
    color: '#b45309',
    features: ['Fee Payment', 'Scholarship Guidance', 'Loan Assistance'],
  },
  {
    title: 'Campus Support',
    description: 'Hostel information, transportation schedules, and campus navigation',
    icon: ApartmentRoundedIcon,
    href: '/campus',
    color: '#6d28d9',
    features: ['Hostel Information', 'Transportation', 'Campus Navigation'],
  },
  {
    title: 'Mental Health Support',
    description: 'Counseling appointments and stress management resources',
    icon: FavoriteRoundedIcon,
    href: '/mental-health',
    color: '#be123c',
    features: ['Counseling Appointments', 'Stress Management', 'Mental Health Resources'],
  },
  {
    title: 'Career Support',
    description: 'Internship discovery, resume reviews, and mock interviews',
    icon: WorkRoundedIcon,
    href: '/career',
    color: '#3730a3',
    features: ['Internship Discovery', 'Resume Reviews', 'Mock Interviews'],
  },
]

const AI_FEATURES = [
  {
    icon: AutoAwesomeRoundedIcon,
    title: 'AI-Powered Responses',
    description: 'Intelligent, context-aware responses to student queries',
  },
  {
    icon: MicRoundedIcon,
    title: 'Voice Interaction',
    description: 'Hands-free conversation with voice-enabled chatbot',
  },
  {
    icon: LanguageRoundedIcon,
    title: 'Multilingual Support',
    description: 'Support for multiple languages to serve diverse students',
  },
  {
    icon: AccessTimeRoundedIcon,
    title: '24/7 Availability',
    description: 'Round-the-clock assistance whenever you need it',
  },
]

const Home: React.FC = () => {
  return (
    <Stack spacing={3.2}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          p: { xs: 2.5, md: 4 },
          background:
            'linear-gradient(130deg, #0f766e 0%, #0ea5e9 70%, #1d4ed8 100%)',
          color: '#fff',
        }}
      >
        <Stack spacing={2.3} sx={{ maxWidth: 920 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
              <AutoAwesomeRoundedIcon />
            </Avatar>
            <Typography variant="h3" sx={{ fontSize: { xs: 30, md: 42 }, fontWeight: 700 }}>
              AI Student Support System
            </Typography>
          </Stack>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 500 }}>
            Your intelligent companion for academic success and campus life
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              component={RouterLink}
              to="/chat"
              variant="contained"
              color="inherit"
              startIcon={<SmartToyRoundedIcon />}
              endIcon={<ArrowForwardRoundedIcon />}
              sx={{ color: '#0f172a', borderRadius: 99, fontWeight: 700 }}
            >
              Start Chatting
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Box>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
          Support Modules
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          {MODULES.map((module) => {
            const Icon = module.icon
            return (
              <Card
                key={module.title}
                component={RouterLink}
                to={module.href}
                sx={{
                  textDecoration: 'none',
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'transform .2s ease, box-shadow .2s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
                    <Avatar sx={{ bgcolor: module.color, width: 42, height: 42 }}>
                      <Icon fontSize="small" />
                    </Avatar>
                    <ArrowForwardRoundedIcon sx={{ color: 'text.disabled' }} />
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {module.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8, mb: 1.2 }}>
                    {module.description}
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.75}>
                    {module.features.map((feature) => (
                      <Chip key={feature} label={feature} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )
          })}
        </Box>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 2.5, borderRadius: 4 }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
          Advanced AI Features
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 2,
          }}
        >
          {AI_FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <Box key={feature.title}>
                <Stack spacing={1} alignItems="flex-start">
                  <Avatar sx={{ width: 48, height: 48, bgcolor: 'secondary.main' }}>
                    <Icon fontSize="small" />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Stack>
              </Box>
            )
          })}
        </Box>
      </Paper>

    </Stack>
  )
}

export default Home
