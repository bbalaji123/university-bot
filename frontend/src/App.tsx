import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import ChatInterface from './pages/ChatInterface'
import StudentQuestions from './pages/StudentQuestions'
import AdmissionAssistance from './pages/modules/AdmissionAssistance'
import AcademicSupport from './pages/modules/AcademicSupport'
import FinancialAssistance from './pages/modules/FinancialAssistance'
import CampusSupport from './pages/modules/CampusSupport'
import MentalHealthSupport from './pages/modules/MentalHealthSupport'
import CareerSupport from './pages/modules/CareerSupport'
import SocialMediaIntegration from './components/SocialMediaIntegration'
import AIGeneratedFAQSystem from './components/AIGeneratedFAQSystem'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminChatbotQuestions from './pages/admin/AdminChatbotQuestions'
import AdminModule from './pages/admin/AdminModule'
import AdminModules from './pages/admin/AdminModules'

const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem('user')
    return rawUser ? JSON.parse(rawUser) : null
  } catch {
    return null
  }
}

const resetAuthOnLoad = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

resetAuthOnLoad()

const isAuthenticated = () => Boolean(localStorage.getItem('token'))
const getRole = () => getStoredUser()?.role

const getHomePath = () => (getRole() === 'admin' ? '/admin' : '/')

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

const PublicOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to={getHomePath()} replace />
  }

  return <>{children}</>
}

const ProtectedLayout: React.FC = () => (
  <RequireAuth>
    <Layout>
      <Outlet />
    </Layout>
  </RequireAuth>
)

const RequireRole: React.FC<{ role: 'admin' | 'student' }> = ({ role }) => {
  const currentRole = getRole()
  if (currentRole !== role) {
    return <Navigate to={getHomePath()} replace />
  }

  return <Outlet />
}

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnly>
              <Register />
            </PublicOnly>
          }
        />
        <Route element={<ProtectedLayout />}>
          <Route element={<RequireRole role="admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/modules" element={<AdminModules />} />
            <Route path="/admin/chatbot-questions" element={<AdminChatbotQuestions />} />
            <Route path="/admin/:moduleId" element={<AdminModule />} />
          </Route>
          <Route element={<RequireRole role="student" />}>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/chat" element={<ChatInterface />} />
            <Route path="/admission" element={<AdmissionAssistance />} />
            <Route path="/academic" element={<AcademicSupport />} />
            <Route path="/financial" element={<FinancialAssistance />} />
            <Route path="/campus" element={<CampusSupport />} />
            <Route path="/mental-health" element={<MentalHealthSupport />} />
            <Route path="/career" element={<CareerSupport />} />
            <Route path="/social-media" element={<SocialMediaIntegration />} />
            <Route path="/ai-faqs" element={<AIGeneratedFAQSystem />} />
            <Route path="/my-questions" element={<StudentQuestions />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App
