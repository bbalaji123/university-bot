import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  GraduationCap,
  ShieldCheck,
  BookOpen
} from 'lucide-react'

interface LoginFormData {
  registrationId: string
  password: string
}

interface ForgotPasswordFormData {
  studentId: string
  year: string
  section: string
  newPassword: string
  confirmPassword: string
}

type LoginMode = 'student' | 'admin'

const HERO_IMAGE = '/vignan-campus.png'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<LoginFormData>({
    registrationId: '',
    password: ''
  })
  const [loginMode, setLoginMode] = useState<LoginMode>('student')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordForm, setForgotPasswordForm] = useState<ForgotPasswordFormData>({
    studentId: '',
    year: '',
    section: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState('')

  const years = ['1', '2', '3', '4', '5', '6']
  const sections = ['A', 'B', 'C', 'D']

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleForgotPasswordInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForgotPasswordForm(prev => ({ ...prev, [name]: value }))
    setForgotError('')
    setForgotSuccess('')
  }

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !forgotPasswordForm.studentId ||
      !forgotPasswordForm.year ||
      !forgotPasswordForm.section ||
      !forgotPasswordForm.newPassword ||
      !forgotPasswordForm.confirmPassword
    ) {
      setForgotError('Please fill in all fields')
      return
    }

    if (forgotPasswordForm.newPassword !== forgotPasswordForm.confirmPassword) {
      setForgotError('Passwords do not match')
      return
    }

    if (forgotPasswordForm.newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long')
      return
    }

    setForgotLoading(true)
    setForgotError('')
    setForgotSuccess('')

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: forgotPasswordForm.studentId,
          year: parseInt(forgotPasswordForm.year),
          section: forgotPasswordForm.section,
          newPassword: forgotPasswordForm.newPassword,
        })
      })

      const data = await response.json()

      if (response.ok) {
        setForgotSuccess(data?.message || 'Password reset successful. Please login.')
        setTimeout(() => {
          setShowForgotPassword(false)
          setForgotPasswordForm({
            studentId: '',
            year: '',
            section: '',
            newPassword: '',
            confirmPassword: ''
          })
          setFormData(prev => ({ ...prev, registrationId: forgotPasswordForm.studentId }))
        }, 1200)
      } else {
        setForgotError(data?.error || data?.message || 'Failed to reset password')
      }
    } catch {
      setForgotError('Network error. Please try again.')
    } finally {
      setForgotLoading(false)
    }
  }

  const validateForm = () => {
    if (!formData.registrationId || !formData.password) {
      setError('Please fill in all fields')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: loginMode === 'student' ? formData.registrationId : undefined,
          adminId: loginMode === 'admin' ? formData.registrationId : undefined,
          password: formData.password,
          role: loginMode
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Store token and user data
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))

        // Redirect by role
        navigate(data.user?.role === 'admin' ? '/admin' : '/')
      } else {
        setError(data.error || 'Login failed. Please check your credentials.')
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-slate-100">
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
      />
      <div className="absolute inset-0 bg-slate-950/70" />
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl float-slow" />
      <div className="absolute -bottom-32 right-10 h-96 w-96 rounded-full bg-rose-500/20 blur-3xl float-slow" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-[68.75rem] min-h-[520px] overflow-hidden rounded-[22px] border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl auth-grid">
          <div className="grid lg:grid-cols-2">
            <div className="bg-slate-900/80 p-6 lg:p-7">
              <div className="fade-up">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-slate-200">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  University Smart Portal
                </div>

                <div className="mt-8 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <span className="text-sm text-slate-300">Secure student access</span>
                </div>

                <h1 className="mt-6 text-4xl font-display leading-tight text-white">
                  AI Student Support
                  <span className="block text-slate-300">System</span>
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  24/7 assistance for admissions, academics, finance, campus services, and counseling with protected portal access.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => setLoginMode('student')}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      loginMode === 'student'
                        ? 'border-cyan-300/60 bg-cyan-500/15 text-white'
                        : 'border-white/10 bg-white/10 text-slate-200 hover:bg-white/20'
                    }`}
                  >
                    Student Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMode('admin')}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      loginMode === 'admin'
                        ? 'border-rose-300/60 bg-rose-500/15 text-white'
                        : 'border-white/10 bg-white/10 text-slate-200 hover:bg-white/20'
                    }`}
                  >
                    Admin Login
                  </button>
                </div>

                <div className="mt-8 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4 text-cyan-300" />
                      <p className="text-sm text-slate-200">Student-first workflow</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Registration-number based sign in with guided support modules.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-4 w-4 text-rose-300" />
                      <p className="text-sm text-slate-200">Protected portal access</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">JWT secured sessions and encrypted student records.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-6 text-slate-900 lg:p-7">
              <div className="fade-up">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">
                  {loginMode === 'student' ? 'Student Login' : 'Admin Login'}
                </p>
                <h2 className="mt-3 text-3xl font-display text-slate-900">
                  {loginMode === 'student' ? 'Welcome back' : 'Admin access'}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {loginMode === 'student'
                    ? 'Sign in with your registration number and mobile number password to access academic, financial, and AI support tools.'
                    : 'Sign in with your admin ID and password to manage student services and system settings.'}
                </p>

                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                  {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                      <AlertCircle className="h-5 w-5 text-rose-500" />
                      <span className="text-sm text-rose-700">{error}</span>
                    </div>
                  )}

                  <div>
                    <label htmlFor="registrationId" className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {loginMode === 'student' ? 'Registration ID' : 'Admin ID'}
                    </label>
                    <div className="relative mt-2">
                      <input
                        id="registrationId"
                        name="registrationId"
                        type="text"
                        required
                        value={formData.registrationId}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm text-slate-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
                        placeholder={loginMode === 'student' ? '231FA0XXXX' : 'ADMIN-001'}
                      />
                      <GraduationCap className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Password
                    </label>
                    <div className="relative mt-2">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-11 pr-11 text-sm text-slate-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
                        placeholder={loginMode === 'student' ? 'Mobile number' : '••••••••'}
                      />
                      <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-3.5 text-slate-400 transition hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                    <label className="flex items-center gap-2 text-slate-600">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-200"
                      />
                      Remember me
                    </label>
                    {loginMode === 'student' && (
                      <button
                        type="button"
                        className="text-slate-500 hover:text-rose-500"
                        onClick={() => {
                          setShowForgotPassword(true)
                          setForgotError('')
                          setForgotSuccess('')
                          setForgotPasswordForm(prev => ({
                            ...prev,
                            studentId: formData.registrationId || prev.studentId
                          }))
                        }}
                      >
                        Forgot password
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? 'Signing In...' : 'Login'}
                  </button>

                  <p className="text-center text-sm text-slate-500">
                    {loginMode === 'student' ? (
                      <>
                        New student?{' '}
                        <Link to="/register" className="font-semibold text-rose-500 hover:text-rose-600">
                          Register here
                        </Link>
                      </>
                    ) : (
                      'Need access? Contact your department admin.'
                    )}
                  </p>
                </form>

                {showForgotPassword && loginMode === 'student' && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Reset Student Password</h3>
                        <button
                          type="button"
                          className="text-sm text-slate-500 hover:text-slate-700"
                          onClick={() => setShowForgotPassword(false)}
                          disabled={forgotLoading}
                        >
                          Close
                        </button>
                      </div>

                      {forgotError && (
                        <div className="mb-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
                          <AlertCircle className="h-4 w-4 text-rose-500" />
                          <span className="text-xs text-rose-700">{forgotError}</span>
                        </div>
                      )}

                      {forgotSuccess && (
                        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                          {forgotSuccess}
                        </div>
                      )}

                      <form className="space-y-3" onSubmit={handleForgotPasswordSubmit}>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Registration ID
                          </label>
                          <input
                            name="studentId"
                            type="text"
                            value={forgotPasswordForm.studentId}
                            onChange={handleForgotPasswordInput}
                            required
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
                            placeholder="231FA0XXXX"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                              Year
                            </label>
                            <select
                              name="year"
                              value={forgotPasswordForm.year}
                              onChange={handleForgotPasswordInput}
                              required
                              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
                            >
                              <option value="">Select</option>
                              {years.map((year) => (
                                <option key={year} value={year}>
                                  Year {year}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                              Section
                            </label>
                            <select
                              name="section"
                              value={forgotPasswordForm.section}
                              onChange={handleForgotPasswordInput}
                              required
                              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
                            >
                              <option value="">Select</option>
                              {sections.map((section) => (
                                <option key={section} value={section}>
                                  Section {section}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            New Password
                          </label>
                          <input
                            name="newPassword"
                            type="password"
                            value={forgotPasswordForm.newPassword}
                            onChange={handleForgotPasswordInput}
                            required
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
                            placeholder="Enter new password"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Confirm New Password
                          </label>
                          <input
                            name="confirmPassword"
                            type="password"
                            value={forgotPasswordForm.confirmPassword}
                            onChange={handleForgotPasswordInput}
                            required
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
                            placeholder="Re-enter password"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={forgotLoading}
                          className="mt-1 w-full rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {forgotLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

