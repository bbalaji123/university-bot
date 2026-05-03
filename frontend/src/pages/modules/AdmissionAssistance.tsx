import React, { useState, useEffect } from 'react'
import { 
  GraduationCap, 
  FileText, 
  CheckCircle, 
  Clock, 
  Calendar,
  Search,
  Filter,
  Download,
  ArrowRight,
  Users,
  BookOpen,
  Award,
  Globe
} from 'lucide-react'
import Modal from '../../components/Modal'

interface Program {
  id: string
  name: string
  duration: string
  requirements: string[]
  deadline: string
  status: 'open' | 'closing-soon' | 'closed'
  tuition: string
  description: string
}

const PROGRAMS: Program[] = [
  {
    id: '1',
    name: 'Computer Science Engineering',
    duration: '4 Years',
    requirements: ['Mathematics (85%+)', 'Physics (75%+)', 'Chemistry (70%+)', 'English (70%+)'],
    deadline: '2024-06-30',
    status: 'open',
    tuition: '$12,000/year',
    description: 'Comprehensive program covering software development, AI, machine learning, and data science.'
  },
  {
    id: '2',
    name: 'Business Administration',
    duration: '3 Years',
    requirements: ['Any Stream (75%+)', 'English (80%+)', 'Mathematics (70%+)'],
    deadline: '2024-05-15',
    status: 'closing-soon',
    tuition: '$10,000/year',
    description: 'Focus on management, finance, marketing, and entrepreneurship with practical business skills.'
  },
  {
    id: '3',
    name: 'Medicine (MBBS)',
    duration: '5 Years',
    requirements: ['Biology (90%+)', 'Chemistry (85%+)', 'Physics (80%+)', 'NEET Qualified'],
    deadline: '2024-07-15',
    status: 'open',
    tuition: '$25,000/year',
    description: 'Rigorous medical program with clinical training and research opportunities.'
  },
  {
    id: '4',
    name: 'Psychology',
    duration: '3 Years',
    requirements: ['Any Stream (70%+)', 'English (75%+)', 'Social Science (70%+)'],
    deadline: '2024-06-01',
    status: 'open',
    tuition: '$8,000/year',
    description: 'Study human behavior, mental processes, and counseling techniques.'
  }
]

const ELIGIBILITY_CRITERIA = [
  { category: 'Academic Requirements', items: ['Minimum 60% in 12th grade', 'Specific subject requirements vary by program', 'Valid entrance exam scores'] },
  { category: 'Age Requirements', items: ['Minimum 17 years as of admission date', 'No upper age limit for most programs'] },
  { category: 'Language Requirements', items: ['IELTS: 6.5+ or TOEFL: 79+ for international students', 'English proficiency test mandatory'] },
  { category: 'Documents Required', items: ['Mark sheets (10th & 12th)', 'Birth certificate', 'Passport size photos', 'Valid ID proof'] }
]

const APPLICATION_STEPS = [
  { step: 1, title: 'Online Registration', description: 'Create account and fill basic information', icon: Users },
  { step: 2, title: 'Program Selection', description: 'Choose your desired program', icon: BookOpen },
  { step: 3, title: 'Document Upload', description: 'Upload required documents', icon: FileText },
  { step: 4, title: 'Application Fee', description: 'Pay the application processing fee', icon: Award },
  { step: 5, title: 'Review & Submit', description: 'Review and submit your application', icon: CheckCircle }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'bg-green-100 text-green-800'
    case 'closing-soon': return 'bg-yellow-100 text-yellow-800'
    case 'closed': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const AdmissionAssistance: React.FC = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closing-soon'>('all')
  const [filterData, setFilterData] = useState({
    deadlineBefore: '',
    tuitionMax: ''
  })
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [showGuidelinesForm, setShowGuidelinesForm] = useState(false)
  const [showBrochureForm, setShowBrochureForm] = useState(false)
  const [showFilterForm, setShowFilterForm] = useState(false)
  const [applicationData, setApplicationData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    previousEducation: '',
    programId: ''
  })
  const [brochureRequest, setBrochureRequest] = useState({
    fullName: '',
    email: ''
  })
  const [guidelinesRequest, setGuidelinesRequest] = useState({
    fullName: '',
    email: ''
  })
  const [applications, setApplications] = useState<any[]>([])
  const [serverApplications, setServerApplications] = useState<any[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [applicationsError, setApplicationsError] = useState('')
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')

  const parseTuitionAmount = (tuition: string) => {
    const digits = tuition.replace(/[^0-9]/g, '')
    return digits ? Number(digits) : 0
  }

  const filteredPrograms = PROGRAMS.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || program.status === filterStatus
    const matchesDeadline = !filterData.deadlineBefore || new Date(program.deadline) <= new Date(filterData.deadlineBefore)
    const matchesTuition = !filterData.tuitionMax || parseTuitionAmount(program.tuition) <= Number(filterData.tuitionMax)
    return matchesSearch && matchesFilter && matchesDeadline && matchesTuition
  })

  const showNotificationWithTimeout = (message: string, durationMs: number) => {
    setNotificationMessage(message)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), durationMs)
  }

  const fetchApplications = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      return
    }

    try {
      setApplicationsLoading(true)
      setApplicationsError('')
      const response = await fetch(`${apiBaseUrl}/admissions/my`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load applications')
      }

      const data = await response.json()
      setServerApplications(data.applications || [])
    } catch (error) {
      setApplicationsError('Unable to load applications from the server')
    } finally {
      setApplicationsLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  // Handler functions
  const handleProgramSelect = (program: Program) => {
    setSelectedProgram(program)
    setApplicationData(prev => ({ ...prev, programId: program.id }))
  }

  const handleApplyNow = () => {
    if (selectedProgram) {
      setShowApplicationForm(true)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setApplicationData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!applicationData.firstName || !applicationData.lastName || !applicationData.email || !applicationData.phone) {
      showNotificationWithTimeout('Please fill in all required fields', 3000)
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      showNotificationWithTimeout('Please login to submit your application', 3000)
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/admissions/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...applicationData,
          programId: selectedProgram?.id,
          programName: selectedProgram?.name
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit application')
      }

      const data = await response.json()
      setApplications(prev => [...prev, data.application])
      setServerApplications(prev => [data.application, ...prev])
      showNotificationWithTimeout(`Application submitted successfully for ${selectedProgram?.name}!`, 5000)
      setShowApplicationForm(false)

      setApplicationData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        address: '',
        previousEducation: '',
        programId: ''
      })
    } catch (error) {
      showNotificationWithTimeout('Failed to submit application. Please try again.', 3000)
    }
  }

  const handleOpenBrochureForm = () => {
    if (!selectedProgram) {
      showNotificationWithTimeout('Select a program to request a brochure', 3000)
      return
    }
    setShowBrochureForm(true)
  }

  const handleSubmitBrochureRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!brochureRequest.fullName || !brochureRequest.email) {
      showNotificationWithTimeout('Please fill in your name and email', 3000)
      return
    }
    showNotificationWithTimeout(`Brochure request submitted for ${selectedProgram?.name}`, 4000)
    setShowBrochureForm(false)
    setBrochureRequest({ fullName: '', email: '' })
  }

  const handleSubmitGuidelinesRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!guidelinesRequest.fullName || !guidelinesRequest.email) {
      showNotificationWithTimeout('Please fill in your name and email', 3000)
      return
    }
    showNotificationWithTimeout('Guidelines request submitted. Check your email shortly.', 4000)
    setShowGuidelinesForm(false)
    setGuidelinesRequest({ fullName: '', email: '' })
  }

  const handleSubmitFilter = (e: React.FormEvent) => {
    e.preventDefault()
    setShowFilterForm(false)
    showNotificationWithTimeout('Filters applied', 2000)
  }

  const handleDownloadBrochure = (programId: string, programName: string) => {
    showNotificationWithTimeout(`Downloading brochure for ${programName}...`, 2000)
    
    // In a real app, this would trigger an actual download
    console.log(`Downloading brochure for program ${programId}`)
  }

  const handleSaveProgram = (program: Program | null) => {
    if (!program) return
    
    const savedPrograms = JSON.parse(localStorage.getItem('savedPrograms') || '[]')
    const exists = savedPrograms.find((p: any) => p.id === program.id)
    
    if (!exists) {
      savedPrograms.push(program)
      localStorage.setItem('savedPrograms', JSON.stringify(savedPrograms))
      showNotificationWithTimeout(`${program.name} saved to your programs!`, 3000)
    } else {
      showNotificationWithTimeout(`${program.name} is already saved!`, 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification Component */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <CheckCircle className="w-5 h-5" />
          <span>{notificationMessage}</span>
        </div>
      )}

      {/* Application Form Modal */}
      {showApplicationForm && selectedProgram && (
        <Modal
          title={`Apply for ${selectedProgram.name}`}
          onClose={() => setShowApplicationForm(false)}
        >
          <form onSubmit={handleSubmitApplication} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={applicationData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={applicationData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={applicationData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={applicationData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={applicationData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  name="address"
                  value={applicationData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Previous Education</label>
                <textarea
                  name="previousEducation"
                  value={applicationData.previousEducation}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowApplicationForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Submit Application
                </button>
              </div>
            </form>
        </Modal>
      )}

      {showBrochureForm && selectedProgram && (
        <Modal
          title={`Request Brochure - ${selectedProgram.name}`}
          onClose={() => setShowBrochureForm(false)}
        >
          <form onSubmit={handleSubmitBrochureRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={brochureRequest.fullName}
                onChange={(e) => setBrochureRequest(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={brochureRequest.email}
                onChange={(e) => setBrochureRequest(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBrochureForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Submit Request
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showGuidelinesForm && (
        <Modal
          title="Request Application Guidelines"
          onClose={() => setShowGuidelinesForm(false)}
        >
          <form onSubmit={handleSubmitGuidelinesRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={guidelinesRequest.fullName}
                onChange={(e) => setGuidelinesRequest(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={guidelinesRequest.email}
                onChange={(e) => setGuidelinesRequest(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowGuidelinesForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Submit Request
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showFilterForm && (
        <Modal
          title="Advanced Program Filters"
          onClose={() => setShowFilterForm(false)}
        >
          <form onSubmit={handleSubmitFilter} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline Before</label>
              <input
                type="date"
                value={filterData.deadlineBefore}
                onChange={(e) => setFilterData(prev => ({ ...prev, deadlineBefore: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Tuition (number)</label>
              <input
                type="number"
                min="0"
                value={filterData.tuitionMax}
                onChange={(e) => setFilterData(prev => ({ ...prev, tuitionMax: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowFilterForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Apply Filters
              </button>
            </div>
          </form>
        </Modal>
      )}

      <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-8">
        <div className="flex items-center mb-4">
          <GraduationCap className="w-8 h-8 mr-3" />
          <h1 className="text-3xl font-bold">Admission Assistance</h1>
        </div>
        <p className="text-blue-100 text-lg mb-6">
          Complete guidance for program selection, eligibility checks, and application tracking
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              <span className="font-semibold">Application Period</span>
            </div>
            <p className="text-blue-100 mt-1">March - July 2024</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              <span className="font-semibold">Seats Available</span>
            </div>
            <p className="text-blue-100 mt-1">2,500+ across programs</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              <span className="font-semibold">Processing Time</span>
            </div>
            <p className="text-blue-100 mt-1">2-4 weeks</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="closing-soon">Closing Soon</option>
            </select>
            <button
              onClick={() => setShowFilterForm(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Programs List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Available Programs</h2>
          <div className="space-y-4">
            {filteredPrograms.map((program) => (
              <div
                key={program.id}
                className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 cursor-pointer transition-all hover:shadow-md ${
                  selectedProgram?.id === program.id ? 'ring-2 ring-primary-500' : ''
                }`}
                onClick={() => handleProgramSelect(program)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{program.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{program.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(program.status)}`}>
                    {program.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    {program.duration}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Award className="w-4 h-4 mr-2" />
                    {program.tuition}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    Deadline: {new Date(program.deadline).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-primary-600 cursor-pointer hover:text-primary-700"
                       onClick={() => handleProgramSelect(program)}>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    View Details
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Program Details & Eligibility */}
        <div className="space-y-6">
          {selectedProgram ? (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedProgram.name}</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
                  <ul className="space-y-2">
                    {selectedProgram.requirements.map((req, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Important Dates</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Application Deadline:</span>
                      <span className="font-medium">{new Date(selectedProgram.deadline).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Results:</span>
                      <span className="font-medium">August 2024</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Session Start:</span>
                      <span className="font-medium">September 2024</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={handleApplyNow}
                  className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Apply Now
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Select a program to view details</p>
            </div>
          )}

          {/* Application Steps */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Application Process</h3>
            <div className="space-y-3">
              {APPLICATION_STEPS.map((step) => {
                const Icon = step.icon
                return (
                  <div key={step.step} className="flex items-start space-x-3">
                    <div className="bg-primary-100 p-2 rounded-lg">
                      <Icon className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Step {step.step}: {step.title}</h4>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* My Applications */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">My Applications</h3>
        {applicationsLoading ? (
          <p className="text-gray-600">Loading applications...</p>
        ) : applicationsError ? (
          <p className="text-red-600">{applicationsError}</p>
        ) : serverApplications.length === 0 ? (
          <p className="text-gray-600">No applications submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {serverApplications.map((app) => (
              <div key={app._id || app.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{app.programName}</h4>
                    <p className="text-sm text-gray-600">Submitted: {new Date(app.submittedAt).toLocaleDateString()}</p>
                  </div>
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {app.status || 'submitted'}
                  </span>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <span>{app.firstName} {app.lastName}</span>
                  <span className="mx-2">•</span>
                  <span>{app.email}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Eligibility Criteria */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">General Eligibility Criteria</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ELIGIBILITY_CRITERIA.map((category) => (
            <div key={category.category} className="space-y-3">
              <h3 className="font-semibold text-gray-900">{category.category}</h3>
              <ul className="space-y-2">
                {category.items.map((item, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-primary-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Resources */}
      <div className="bg-primary-50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Helpful Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={handleOpenBrochureForm}
            className="flex items-center justify-center space-x-2 p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <Download className="w-5 h-5 text-primary-600" />
            <span className="font-medium">Download Brochure</span>
          </button>
          <button
            onClick={() => setShowGuidelinesForm(true)}
            className="flex items-center justify-center space-x-2 p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <FileText className="w-5 h-5 text-primary-600" />
            <span className="font-medium">Application Guidelines</span>
          </button>
          <button 
            onClick={() => handleSaveProgram(selectedProgram)}
            className="flex items-center justify-center space-x-2 p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <Globe className="w-5 h-5 text-primary-600" />
            <span className="font-medium">Save Program</span>
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}

export default AdmissionAssistance

