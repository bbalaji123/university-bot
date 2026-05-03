import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  GraduationCap,
  Mail,
  Phone,
  ShieldCheck,
  User
} from 'lucide-react'

interface RegisterFormData {
  fullName: string
  email: string
  studentId: string
  year: string
  section: string
  gpa: string
  mobileNumber: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
const HERO_IMAGE = '/vignan-campus.png'

const Register: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    email: '',
    studentId: '',
    year: '',
    section: '',
    gpa: '',
    mobileNumber: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const years = ['1', '2', '3', '4', '5', '6']
  const sections = ['A', 'B', 'C', 'D']

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
    setSuccess('')
  }

  const validateForm = () => {
    if (
      !formData.fullName ||
      !formData.studentId ||
      !formData.year ||
      !formData.section ||
      !formData.mobileNumber
    ) {
      setError('Please fill in all required fields')
      return false
    }

    if (!/^\d{10}$/.test(formData.mobileNumber)) {
      setError('Mobile number must be exactly 10 digits')
      return false
    }

    if (!/^[A-Za-z0-9]{6,20}$/.test(formData.studentId)) {
      setError('Registration number must be 6-20 alphanumeric characters')
      return false
    }

    if (formData.gpa && (parseFloat(formData.gpa) < 0 || parseFloat(formData.gpa) > 10.0)) {
      setError('CGPA must be between 0.0 and 10.0')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email || undefined,
          password: formData.mobileNumber,
          mobileNumber: formData.mobileNumber,
          studentId: formData.studentId,
          year: parseInt(formData.year),
          section: formData.section,
          gpa: formData.gpa ? parseFloat(formData.gpa) : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Account created successfully! Redirecting to login...')
        setTimeout(() => {
          navigate('/login')
        }, 1800)
      } else {
        setError(data.error || 'Registration failed. Please try again.')
      }
    } catch {
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
        <div className="w-full max-w-[68.75rem] min-h-[560px] overflow-hidden rounded-[22px] border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl auth-grid">
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
                  <span className="text-sm text-slate-300">Secure student onboarding</span>
                </div>

                <h1 className="mt-6 text-4xl font-display leading-tight text-white">
                  AI Student Support
                  <span className="block text-slate-300">System</span>
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  Create your student account to access admissions, academics, finance, campus services, and counseling support.
                </p>

                <div className="mt-8 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4 text-cyan-300" />
                      <p className="text-sm text-slate-200">Registration-number workflow</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Sign up with your registration number and use your mobile number to log in.</p>
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
                  Student Sign Up
                </p>
                <h2 className="mt-3 text-3xl font-display text-slate-900">Create account</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Use your student credentials. You can sign in with your registration number and mobile number.
                </p>

                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                  {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                      <AlertCircle className="h-5 w-5 text-rose-500" />
                      <span className="text-sm text-rose-700">{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm text-emerald-700">{success}</span>
                    </div>
                  )}

                  <div>
                    <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Full Name
                    </label>
                    <div className="relative mt-2">
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm text-slate-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
                        placeholder="John Doe"
                      />
                      <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Email (Optional)
                    </label>
                    <div className="relative mt-2">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm text-slate-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
                        placeholder="johndoe@example.com"
                      />
                      <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="studentId" className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Registration Number
                    </label>
                    <div className="relative mt-2">
                      <input
                        id="studentId"
                        name="studentId"
                        type="text"
                        required
                        value={formData.studentId}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm text-slate-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
                        placeholder="231FA04860"
                      />
                      <GraduationCap className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="year" className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Year
                      </label>
                      <select
                        id="year"
                        name="year"
                        required
                        value={formData.year}
                        onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
                      >
                        <option value="">Select Year</option>
                        {years.map((year) => (
                          <option key={year} value={year}>
                            Year {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="section" className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Section
                      </label>
                      <select
                        id="section"
                        name="section"
                        required
                        value={formData.section}
                        onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
                      >
                        <option value="">Select Section</option>
                        {sections.map((section) => (
                          <option key={section} value={section}>
                            Section {section}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="gpa" className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      CGPA (Optional)
                    </label>
                    <input
                      id="gpa"
                      name="gpa"
                      type="text"
                      value={formData.gpa}
                      onChange={handleInputChange}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
                      placeholder="8.5"
                    />
                  </div>

                  <div>
                    <label htmlFor="mobileNumber" className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Mobile Number (Used as Password)
                    </label>
                    <div className="relative mt-2">
                      <input
                        id="mobileNumber"
                        name="mobileNumber"
                        type="text"
                        required
                        value={formData.mobileNumber}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm text-slate-900 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
                        placeholder="9876543210"
                      />
                      <Phone className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? 'Creating account...' : 'Sign Up'}
                  </button>

                  <p className="text-center text-sm text-slate-500">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-rose-500 hover:text-rose-600">
                      Sign in here
                    </Link>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register

