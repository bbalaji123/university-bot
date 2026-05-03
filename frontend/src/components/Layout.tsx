import React, { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import WorkRoundedIcon from '@mui/icons-material/WorkRounded'
import ShareRoundedIcon from '@mui/icons-material/ShareRounded'
import QuizRoundedIcon from '@mui/icons-material/QuizRounded'
import ViewModuleRoundedIcon from '@mui/icons-material/ViewModuleRounded'
import ContactSupportRoundedIcon from '@mui/icons-material/ContactSupportRounded'
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import {
  AppBar,
  Avatar,
  Box,
  Menu,
  MenuItem,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  Button,
} from '@mui/material'
import { ThemeModeContext } from '../main'

interface LayoutProps {
  children: React.ReactNode
}

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
}

const drawerWidth = 290

const STUDENT_NAVIGATION: NavItem[] = [
  { name: 'Home', href: '/', icon: HomeRoundedIcon },
  { name: 'Profile', href: '/profile', icon: PersonRoundedIcon },
  { name: 'AI Chatbot', href: '/chat', icon: SmartToyRoundedIcon },
  { name: 'Admission', href: '/admission', icon: SchoolRoundedIcon },
  { name: 'Academic', href: '/academic', icon: MenuBookRoundedIcon },
  { name: 'Financial', href: '/financial', icon: AccountBalanceWalletRoundedIcon },
  { name: 'Campus', href: '/campus', icon: ApartmentRoundedIcon },
  { name: 'Mental Health', href: '/mental-health', icon: FavoriteRoundedIcon },
  { name: 'Career', href: '/career', icon: WorkRoundedIcon },
  { name: 'Social Media', href: '/social-media', icon: ShareRoundedIcon },
  { name: 'AI FAQs', href: '/ai-faqs', icon: QuizRoundedIcon },
  { name: 'My Questions', href: '/my-questions', icon: ContactSupportRoundedIcon },
]

const ADMIN_NAVIGATION: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: HomeRoundedIcon },
  { name: 'Modules', href: '/admin/modules', icon: ViewModuleRoundedIcon },
  { name: 'Admission Module', href: '/admin/admission', icon: SchoolRoundedIcon },
  { name: 'Academic Module', href: '/admin/academic', icon: MenuBookRoundedIcon },
  { name: 'Financial Module', href: '/admin/financial', icon: AccountBalanceWalletRoundedIcon },
  { name: 'Campus Module', href: '/admin/campus', icon: ApartmentRoundedIcon },
  { name: 'Mental Health Module', href: '/admin/mental-health', icon: FavoriteRoundedIcon },
  { name: 'Career Module', href: '/admin/career', icon: WorkRoundedIcon },
  { name: 'Social Media Module', href: '/admin/social-media', icon: ShareRoundedIcon },
  { name: 'AI FAQs Module', href: '/admin/ai-faqs', icon: QuizRoundedIcon },
  { name: 'Chatbot Questions', href: '/admin/chatbot-questions', icon: ContactSupportRoundedIcon },
]

const LANGUAGE_OPTIONS = [
  { label: 'English', code: 'en' },
  { label: 'Hindi', code: 'hi' },
  { label: 'Telugu', code: 'te' },
]

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [languageAnchorEl, setLanguageAnchorEl] = useState<null | HTMLElement>(null)
  const [languageLabel, setLanguageLabel] = useState('English')
  const location = useLocation()
  const navigate = useNavigate()
  const { mode, toggleMode } = React.useContext(ThemeModeContext)

  useEffect(() => {
    const scriptId = 'google-translate-script'
    const elementId = 'google_translate_element'

    if (!document.getElementById(elementId)) {
      const container = document.createElement('div')
      container.id = elementId
      container.style.display = 'none'
      document.body.appendChild(container)
    }

    if (!(window as any).googleTranslateElementInit) {
      ;(window as any).googleTranslateElementInit = () => {
        const googleObj = (window as any).google
        if (googleObj?.translate?.TranslateElement) {
          new googleObj.translate.TranslateElement(
            {
              pageLanguage: 'en',
              autoDisplay: false,
              includedLanguages: 'en,hi,te',
            },
            elementId
          )
        }
      }
    }

    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (token && userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }

  const applyPageLanguage = (code: string, label: string) => {
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null
    if (!select) {
      return
    }

    select.value = code
    select.dispatchEvent(new Event('change'))
    setLanguageLabel(label)
  }

  const navigation = useMemo(
    () => (user?.role === 'admin' ? ADMIN_NAVIGATION : STUDENT_NAVIGATION),
    [user?.role]
  )

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`)

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ px: 2, py: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <AutoAwesomeRoundedIcon />
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }} noWrap>
            AI Student Support
          </Typography>
          <Typography variant="caption" color="text.secondary">
          
          </Typography>
        </Box>
      </Stack>
      <Divider />

      <List sx={{ px: 1.2, py: 1.5, flex: 1, overflowY: 'auto' }}>
        {navigation.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <ListItemButton
              key={item.name}
              component={RouterLink}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                bgcolor: active ? 'primary.main' : 'transparent',
                color: active ? '#fff' : 'text.primary',
                '&:hover': {
                  bgcolor: active ? 'primary.dark' : 'action.hover',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item.name} primaryTypographyProps={{ fontSize: 14, fontWeight: 700 }} />
            </ListItemButton>
          )
        })}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          ml: { lg: `${drawerWidth}px` },
          borderBottom: '1px solid',
          borderColor: 'divider',
          backdropFilter: 'blur(6px)',
        }}
      >
        <Toolbar sx={{ minHeight: 72, px: { xs: 1.5, sm: 2.5 } }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { lg: 'none' }, mr: 1 }}
          >
            <MenuRoundedIcon />
          </IconButton>

          <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
            {navigation.find((item) => isActive(item.href))?.name || 'AI Student Support System'}
          </Typography>

          <Tooltip title={mode === 'light' ? 'Enable dark theme' : 'Enable light theme'}>
            <IconButton color="inherit" onClick={toggleMode}>
              {mode === 'light' ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title={`Language: ${languageLabel}`}>
            <IconButton
              color="inherit"
              onClick={(event) => setLanguageAnchorEl(event.currentTarget)}
            >
              <TranslateRoundedIcon />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={languageAnchorEl}
            open={Boolean(languageAnchorEl)}
            onClose={() => setLanguageAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <MenuItem
                key={option.code}
                selected={languageLabel === option.label}
                onClick={() => {
                  applyPageLanguage(option.code, option.label)
                  setLanguageAnchorEl(null)
                }}
              >
                {option.label}
              </MenuItem>
            ))}
          </Menu>

          {user ? (
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ ml: 1.5 }}>
              <Paper
                variant="outlined"
                sx={{
                  px: 1.4,
                  py: 0.8,
                  borderRadius: 99,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.main', fontSize: 12 }}>
                  {user?.firstName?.[0] || 'U'}
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {user.firstName} {user.lastName}
                </Typography>
              </Paper>
              <Button
                color="error"
                variant="outlined"
                startIcon={<LogoutRoundedIcon />}
                onClick={handleLogout}
                sx={{ borderRadius: 99 }}
              >
                Logout
              </Button>
            </Stack>
          ) : (
            <Button component={RouterLink} to="/login" variant="outlined" startIcon={<LoginRoundedIcon />} sx={{ ml: 1 }}>
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.paper',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          pt: 10.5,
          px: { xs: 1.25, sm: 2.25 },
          pb: 2.5,
        }}
      >
        <Box sx={{ maxWidth: 1300, mx: 'auto' }}>{children}</Box>
      </Box>
    </Box>
  )
}

export default Layout
