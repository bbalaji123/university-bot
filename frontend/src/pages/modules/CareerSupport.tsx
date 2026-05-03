import React, { useEffect, useState } from 'react'
import {
  Briefcase,
  FileText,
  Calendar,
  Search,
  Filter,
  MapPin,
  Clock,
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Modal from '../../components/Modal'

interface Internship {
  id: string
  title: string
  company: string
  location: string
  type: 'remote' | 'hybrid' | 'on-site'
  duration: string
  stipend: string
  deadline: string
  status: 'open' | 'closing-soon' | 'closed'
  skills: string[]
  description: string
}

interface CareerEvent {
  id: string
  title: string
  date: string
  location: string
  type: 'career-fair' | 'workshop' | 'info-session'
  description: string
}

const INTERNSHIPS: Internship[] = [
  {
    id: '1',
    title: 'Frontend Engineering Intern',
    company: 'NovaTech Labs',
    location: 'Remote',
    type: 'remote',
    duration: '12 weeks',
    stipend: '$1,200/month',
    deadline: '2024-05-20',
    status: 'open',
    skills: ['React', 'TypeScript', 'UI/UX'],
    description: 'Build responsive product experiences with a cross-functional team.'
  },
  {
    id: '2',
    title: 'Data Analytics Intern',
    company: 'InsightWorks',
    location: 'Hyderabad',
    type: 'hybrid',
    duration: '10 weeks',
    stipend: '$1,000/month',
    deadline: '2024-04-30',
    status: 'closing-soon',
    skills: ['SQL', 'Python', 'Tableau'],
    description: 'Analyze student engagement data and build reporting dashboards.'
  },
  {
    id: '3',
    title: 'Product Management Intern',
    company: 'CampusCloud',
    location: 'Bengaluru',
    type: 'on-site',
    duration: '8 weeks',
    stipend: '$900/month',
    deadline: '2024-05-10',
    status: 'open',
    skills: ['Research', 'Roadmapping', 'Communication'],
    description: 'Support product discovery, user interviews, and backlog planning.'
  },
  {
    id: '4',
    title: 'Cybersecurity Intern',
    company: 'SecureCore',
    location: 'Remote',
    type: 'remote',
    duration: '16 weeks',
    stipend: '$1,400/month',
    deadline: '2024-04-15',
    status: 'closed',
    skills: ['Network Security', 'Threat Analysis', 'Linux'],
    description: 'Assist the SOC team in monitoring, detection, and reporting.'
  }
]

const CAREER_EVENTS: CareerEvent[] = [
  {
    id: '1',
    title: 'Spring Career Fair',
    date: '2024-04-22',
    location: 'Main Auditorium',
    type: 'career-fair',
    description: 'Meet 50+ recruiters from tech, finance, and consulting.'
  },
  {
    id: '2',
    title: 'Resume Masterclass',
    date: '2024-04-18',
    location: 'Innovation Lab',
    type: 'workshop',
    description: 'Improve resume impact with hiring managers and alumni mentors.'
  },
  {
    id: '3',
    title: 'Product Roles Info Session',
    date: '2024-05-02',
    location: 'Online (Zoom)',
    type: 'info-session',
    description: 'Learn how to land PM internships and entry-level roles.'
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'bg-green-100 text-green-800'
    case 'closing-soon': return 'bg-yellow-100 text-yellow-800'
    case 'closed': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getEventColor = (type: string) => {
  switch (type) {
    case 'career-fair': return 'bg-blue-100 text-blue-800'
    case 'workshop': return 'bg-purple-100 text-purple-800'
    case 'info-session': return 'bg-teal-100 text-teal-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const CareerSupport: React.FC = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
  const [activeTab, setActiveTab] = useState<'internships' | 'resume' | 'interviews' | 'events'>('internships')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closing-soon' | 'closed'>('all')
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null)
  const [showResumeForm, setShowResumeForm] = useState(false)
  const [showInterviewForm, setShowInterviewForm] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [resumeForm, setResumeForm] = useState({
    resumeTitle: '',
    targetRole: '',
    resumeLink: '',
    fullName: '',
    studentId: '',
    email: '',
    notes: ''
  })
  const [interviewForm, setInterviewForm] = useState({
    role: '',
    preferredDate: '',
    experienceLevel: 'intermediate',
    fullName: '',
    studentId: '',
    email: '',
    notes: ''
  })
  const [resumeRequests, setResumeRequests] = useState<any[]>([])
  const [mockInterviewRequests, setMockInterviewRequests] = useState<any[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordsError, setRecordsError] = useState('')

  const filteredInternships = INTERNSHIPS.filter(internship => {
    const matchesSearch = internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      internship.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || internship.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const showNotificationWithTimeout = (message: string, durationMs: number) => {
    setNotificationMessage(message)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), durationMs)
  }

  const fetchCareerRecords = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setRecordsLoading(true)
      setRecordsError('')

      const [resumeRes, interviewRes] = await Promise.all([
        fetch(`${apiBaseUrl}/career/resume-reviews`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiBaseUrl}/career/mock-interviews`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (!resumeRes.ok || !interviewRes.ok) {
        throw new Error('Failed to load career records')
      }

      const resumeData = await resumeRes.json()
      const interviewData = await interviewRes.json()

      setResumeRequests(resumeData.requests || [])
      setMockInterviewRequests(interviewData.requests || [])
    } catch (error) {
      setRecordsError('Unable to load career requests from the server')
    } finally {
      setRecordsLoading(false)
    }
  }

  useEffect(() => {
    fetchCareerRecords()
  }, [])

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setResumeForm(prev => ({ ...prev, [name]: value }))
  }

  const handleInterviewChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement> | React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setInterviewForm(prev => ({ ...prev, [name]: value }))
  }

  const submitResumeReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resumeForm.resumeTitle || !resumeForm.targetRole || !resumeForm.fullName || !resumeForm.studentId || !resumeForm.email) {
      showNotificationWithTimeout('Please fill in all required fields', 3000)
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      showNotificationWithTimeout('Please login to submit your request', 3000)
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/career/resume-reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(resumeForm)
      })

      if (!response.ok) {
        throw new Error('Failed to submit resume review request')
      }

      showNotificationWithTimeout('Resume review request submitted successfully', 3000)
      setShowResumeForm(false)
      setResumeForm({
        resumeTitle: '',
        targetRole: '',
        resumeLink: '',
        fullName: '',
        studentId: '',
        email: '',
        notes: ''
      })
      fetchCareerRecords()
    } catch (error) {
      showNotificationWithTimeout('Unable to submit resume review request', 3000)
    }
  }

  const submitMockInterview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!interviewForm.role || !interviewForm.preferredDate || !interviewForm.fullName || !interviewForm.studentId || !interviewForm.email) {
      showNotificationWithTimeout('Please fill in all required fields', 3000)
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      showNotificationWithTimeout('Please login to submit your request', 3000)
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/career/mock-interviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(interviewForm)
      })

      if (!response.ok) {
        throw new Error('Failed to submit mock interview request')
      }

      showNotificationWithTimeout('Mock interview request submitted successfully', 3000)
      setShowInterviewForm(false)
      setInterviewForm({
        role: '',
        preferredDate: '',
        experienceLevel: 'intermediate',
        fullName: '',
        studentId: '',
        email: '',
        notes: ''
      })
      fetchCareerRecords()
    } catch (error) {
      showNotificationWithTimeout('Unable to submit mock interview request', 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Career Support</h1>
              <p className="mt-2 text-sm text-gray-600">
                Internship discovery, resume reviews, and mock interviews to get you hired faster.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowResumeForm(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
              >
                <FileText className="h-4 w-4" />
                Request resume review
              </button>
              <button
                onClick={() => setShowInterviewForm(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
              >
                <Briefcase className="h-4 w-4" />
                Book mock interview
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {['internships', 'resume', 'interviews', 'events'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab === 'internships' && 'Internships'}
                {tab === 'resume' && 'Resume Review'}
                {tab === 'interviews' && 'Mock Interviews'}
                {tab === 'events' && 'Career Events'}
              </button>
            ))}
          </div>
        </div>

        {showNotification && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
            {notificationMessage}
          </div>
        )}

        {recordsError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {recordsError}
          </div>
        )}

        {activeTab === 'internships' && (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Open internship roles</h2>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search roles"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm"
                      />
                    </div>
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                        className="w-full rounded-lg border border-gray-200 pl-9 pr-8 py-2 text-sm"
                      >
                        <option value="all">All statuses</option>
                        <option value="open">Open</option>
                        <option value="closing-soon">Closing soon</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {filteredInternships.map((internship) => (
                    <button
                      key={internship.id}
                      onClick={() => setSelectedInternship(internship)}
                      className="w-full rounded-xl border border-gray-200 p-4 text-left transition hover:shadow-sm"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{internship.title}</h3>
                          <p className="text-sm text-gray-500">{internship.company} • {internship.location}</p>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(internship.status)}`}>
                          {internship.status.replace('-', ' ')}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-gray-600">{internship.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{internship.duration}</span>
                        <span className="inline-flex items-center gap-1"><TrendingUp className="h-3 w-3" />{internship.stipend}</span>
                        <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />Deadline {internship.deadline}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">Selected internship</h3>
                {selectedInternship ? (
                  <div className="mt-4 space-y-4 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{selectedInternship.title}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(selectedInternship.status)}`}>
                        {selectedInternship.status.replace('-', ' ')}
                      </span>
                    </div>
                    <p>{selectedInternship.company}</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{selectedInternship.location} · {selectedInternship.type}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedInternship.skills.map((skill) => (
                        <span key={skill} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">Select a role to view details.</p>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">Career momentum</h3>
                <div className="mt-4 space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>82 students booked interviews this week</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <span>Top roles: Product, Frontend, Data</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-gray-500" />
                    <span>Resume review turnaround: 48 hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resume' && (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Your resume review requests</h2>
                <button
                  onClick={() => setShowResumeForm(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  <FileText className="h-4 w-4" />
                  New request
                </button>
              </div>

              {recordsLoading ? (
                <p className="mt-6 text-sm text-gray-500">Loading requests...</p>
              ) : resumeRequests.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                  No resume review requests yet. Submit one to get feedback from the career team.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {resumeRequests.map((request) => (
                    <div key={request._id} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">{request.resumeTitle}</h3>
                          <p className="text-sm text-gray-500">Target role: {request.targetRole}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(request.status || 'open')}`}>
                          {request.status || 'submitted'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">Submitted {new Date(request.submittedAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">What to submit</h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Latest resume PDF</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Target role and company</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Key projects to highlight</li>
              </ul>
              <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                Typical feedback within 2 working days.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'interviews' && (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Mock interview schedule</h2>
                <button
                  onClick={() => setShowInterviewForm(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  <Briefcase className="h-4 w-4" />
                  Book session
                </button>
              </div>

              {recordsLoading ? (
                <p className="mt-6 text-sm text-gray-500">Loading requests...</p>
              ) : mockInterviewRequests.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                  No mock interviews booked yet. Reserve a slot to practice.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {mockInterviewRequests.map((request) => (
                    <div key={request._id} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">{request.role}</h3>
                          <p className="text-sm text-gray-500">Preferred date: {request.preferredDate}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(request.status || 'open')}`}>
                          {request.status || 'submitted'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">Experience level: {request.experienceLevel}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Mock interview tips</h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2"><AlertCircle className="h-4 w-4 text-amber-500" />Prepare STAR examples</li>
                <li className="flex items-start gap-2"><AlertCircle className="h-4 w-4 text-amber-500" />Review the job description</li>
                <li className="flex items-start gap-2"><AlertCircle className="h-4 w-4 text-amber-500" />Practice timed questions</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {CAREER_EVENTS.map((event) => (
              <div key={event.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getEventColor(event.type)}`}>
                    {event.type.replace('-', ' ')}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{event.description}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" />{event.date}</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{event.location}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showResumeForm && (
        <Modal title="Request Resume Review" onClose={() => setShowResumeForm(false)}>
          <form onSubmit={submitResumeReview} className="space-y-4">
            <input
              type="text"
              name="resumeTitle"
              placeholder="Resume title"
              value={resumeForm.resumeTitle}
              onChange={handleResumeChange}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              required
            />
            <input
              type="text"
              name="targetRole"
              placeholder="Target role"
              value={resumeForm.targetRole}
              onChange={handleResumeChange}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              required
            />
            <input
              type="text"
              name="resumeLink"
              placeholder="Resume link (optional)"
              value={resumeForm.resumeLink}
              onChange={handleResumeChange}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              type="text"
              name="fullName"
              placeholder="Full name"
              value={resumeForm.fullName}
              onChange={handleResumeChange}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              required
            />
            <input
              type="text"
              name="studentId"
              placeholder="Student ID"
              value={resumeForm.studentId}
              onChange={handleResumeChange}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={resumeForm.email}
              onChange={handleResumeChange}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              required
            />
            <textarea
              name="notes"
              placeholder="Notes for the reviewer"
              value={resumeForm.notes}
              onChange={handleResumeChange}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              rows={3}
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Submit request
            </button>
          </form>
        </Modal>
      )}

      {showInterviewForm && (
        <Modal title="Book Mock Interview" onClose={() => setShowInterviewForm(false)}>
          <form onSubmit={submitMockInterview} className="space-y-4">
            <input
              type="text"
              name="role"
              placeholder="Target role"
              value={interviewForm.role}
              onChange={handleInterviewChange}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              required
            />
            <input
              type="date"
              name="preferredDate"
              value={interviewForm.preferredDate}
              onChange={handleInterviewChange}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              required
            />
            <select
              name="experienceLevel"
              value={interviewForm.experienceLevel}
              onChange={handleInterviewChange}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <input
              type="text"
              name="fullName"
              placeholder="Full name"
              value={interviewForm.fullName}
              onChange={handleInterviewChange}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              required
            />
            <input
              type="text"
              name="studentId"
              placeholder="Student ID"
              value={interviewForm.studentId}
              onChange={handleInterviewChange}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={interviewForm.email}
              onChange={handleInterviewChange}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              required
            />
            <textarea
              name="notes"
              placeholder="Notes for the interviewer"
              value={interviewForm.notes}
              onChange={handleInterviewChange}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              rows={3}
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Book interview
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default CareerSupport

