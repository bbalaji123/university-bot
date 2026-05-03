import React, { useState, useEffect } from 'react'
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Users, 
  Award,
  Search,
  Filter,
  Download,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react'
import Modal from '../../components/Modal'

interface Course {
  id: string
  code: string
  name: string
  credits: number
  instructor: string
  schedule: string
  status: 'available' | 'full' | 'prerequisite'
  description: string
}

interface AcademicEvent {
  id: string
  title: string
  date: string
  type: 'exam' | 'assignment' | 'holiday' | 'registration'
  description: string
}

const COURSES: Course[] = [
  {
    id: '1',
    code: 'CS101',
    name: 'Introduction to Computer Science',
    credits: 3,
    instructor: 'Dr. Sarah Johnson',
    schedule: 'Mon, Wed, Fri - 9:00 AM',
    status: 'available',
    description: 'Fundamentals of programming, algorithms, and data structures.'
  },
  {
    id: '2',
    code: 'MATH201',
    name: 'Calculus II',
    credits: 4,
    instructor: 'Prof. Michael Chen',
    schedule: 'Tue, Thu - 10:30 AM',
    status: 'prerequisite',
    description: 'Advanced calculus topics including integration techniques and series.'
  },
  {
    id: '3',
    code: 'ENG102',
    name: 'Academic Writing',
    credits: 3,
    instructor: 'Dr. Emily Davis',
    schedule: 'Mon, Wed - 2:00 PM',
    status: 'available',
    description: 'Develop academic writing skills for research papers and essays.'
  },
  {
    id: '4',
    code: 'PHYS101',
    name: 'Physics I',
    credits: 4,
    instructor: 'Dr. Robert Wilson',
    schedule: 'Tue, Thu, Fri - 11:00 AM',
    status: 'full',
    description: 'Introduction to mechanics, thermodynamics, and waves.'
  }
]

const ACADEMIC_EVENTS: AcademicEvent[] = [
  {
    id: '1',
    title: 'Mid-term Examination Period',
    date: '2024-03-15',
    type: 'exam',
    description: 'Mid-term exams for all courses'
  },
  {
    id: '2',
    title: 'Course Registration Opens',
    date: '2024-03-20',
    type: 'registration',
    description: 'Registration for Fall 2024 semester begins'
  },
  {
    id: '3',
    title: 'Spring Break',
    date: '2024-04-01',
    type: 'holiday',
    description: 'No classes - Spring break week'
  },
  {
    id: '4',
    title: 'Research Paper Due',
    date: '2024-03-25',
    type: 'assignment',
    description: 'Final research paper submission deadline'
  }
]

const CREDIT_REQUIREMENTS = [
  { category: 'Core Courses', required: 45, completed: 32, remaining: 13 },
  { category: 'Electives', required: 18, completed: 8, remaining: 10 },
  { category: 'General Education', required: 24, completed: 20, remaining: 4 },
  { category: 'Total Credits', required: 120, completed: 75, remaining: 45 }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available': return 'bg-green-100 text-green-800'
    case 'full': return 'bg-red-100 text-red-800'
    case 'prerequisite': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'exam': return 'bg-red-100 text-red-800'
    case 'assignment': return 'bg-blue-100 text-blue-800'
    case 'holiday': return 'bg-green-100 text-green-800'
    case 'registration': return 'bg-purple-100 text-purple-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const AcademicSupport: React.FC = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [courseStatusFilter, setCourseStatusFilter] = useState<'all' | 'available' | 'full' | 'prerequisite'>('all')
  const [activeTab, setActiveTab] = useState<'courses' | 'calendar' | 'requirements'>('courses')
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [showCalendarForm, setShowCalendarForm] = useState(false)
  const [showFilterForm, setShowFilterForm] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [registrationData, setRegistrationData] = useState({
    fullName: '',
    studentId: '',
    email: '',
    notes: ''
  })
  const [calendarRequest, setCalendarRequest] = useState({
    fullName: '',
    email: ''
  })
  const [registrations, setRegistrations] = useState<any[]>([])
  const [registrationsLoading, setRegistrationsLoading] = useState(false)
  const [registrationsError, setRegistrationsError] = useState('')

  const filteredCourses = COURSES.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = courseStatusFilter === 'all' || course.status === courseStatusFilter
    return matchesSearch && matchesStatus
  })

  const showNotificationWithTimeout = (message: string, durationMs: number) => {
    setNotificationMessage(message)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), durationMs)
  }

  const fetchRegistrations = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setRegistrationsLoading(true)
      setRegistrationsError('')
      const response = await fetch(`${apiBaseUrl}/academic/registrations`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load registrations')
      }

      const data = await response.json()
      setRegistrations(data.registrations || [])
    } catch (error) {
      setRegistrationsError('Unable to load registrations from the server')
    } finally {
      setRegistrationsLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistrations()
  }, [])

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registrationData.fullName || !registrationData.studentId || !registrationData.email) {
      showNotificationWithTimeout('Please fill in all required fields', 3000)
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      showNotificationWithTimeout('Please login to submit your request', 3000)
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/academic/registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: selectedCourse?.id,
          courseCode: selectedCourse?.code,
          courseName: selectedCourse?.name,
          ...registrationData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit registration')
      }

      const data = await response.json()
      setRegistrations(prev => [data.registration, ...prev])
      showNotificationWithTimeout(`Registration request submitted for ${selectedCourse?.code}`, 4000)
      setShowRegistrationForm(false)
      setRegistrationData({ fullName: '', studentId: '', email: '', notes: '' })
    } catch (error) {
      showNotificationWithTimeout('Failed to submit registration. Please try again.', 3000)
    }
  }

  const handleSubmitCalendarRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!calendarRequest.fullName || !calendarRequest.email) {
      showNotificationWithTimeout('Please fill in your name and email', 3000)
      return
    }
    showNotificationWithTimeout('Calendar request submitted. Check your email shortly.', 4000)
    setShowCalendarForm(false)
    setCalendarRequest({ fullName: '', email: '' })
  }

  const handleSubmitFilter = (e: React.FormEvent) => {
    e.preventDefault()
    setShowFilterForm(false)
    showNotificationWithTimeout('Course filters applied', 2000)
  }

  return (
    <div className="space-y-8">
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {notificationMessage}
        </div>
      )}

      {showRegistrationForm && selectedCourse && (
        <Modal
          title={`Register for ${selectedCourse.code}`}
          onClose={() => setShowRegistrationForm(false)}
        >
          <form onSubmit={handleSubmitRegistration} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={registrationData.fullName}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
              <input
                type="text"
                value={registrationData.studentId}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, studentId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={registrationData.email}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={registrationData.notes}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRegistrationForm(false)}
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

      {showCalendarForm && (
        <Modal
          title="Request Academic Calendar"
          onClose={() => setShowCalendarForm(false)}
        >
          <form onSubmit={handleSubmitCalendarRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={calendarRequest.fullName}
                onChange={(e) => setCalendarRequest(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={calendarRequest.email}
                onChange={(e) => setCalendarRequest(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCalendarForm(false)}
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
          title="Filter Courses"
          onClose={() => setShowFilterForm(false)}
        >
          <form onSubmit={handleSubmitFilter} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={courseStatusFilter}
                onChange={(e) => setCourseStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="full">Full</option>
                <option value="prerequisite">Prerequisite Required</option>
              </select>
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
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-8">
        <div className="flex items-center mb-4">
          <BookOpen className="w-8 h-8 mr-3" />
          <h1 className="text-3xl font-bold">Academic Support</h1>
        </div>
        <p className="text-green-100 text-lg mb-6">
          Course registration guidance, credit requirements, and academic calendar information
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center">
              <Award className="w-5 h-5 mr-2" />
              <span className="font-semibold">Current Credits</span>
            </div>
            <p className="text-green-100 mt-1">75 of 120 completed</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              <span className="font-semibold">Academic Advisor</span>
            </div>
            <p className="text-green-100 mt-1">Dr. Patricia Brown</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              <span className="font-semibold">Current GPA</span>
            </div>
            <p className="text-green-100 mt-1">3.7 / 4.0</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'courses'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Course Registration
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'calendar'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Academic Calendar
          </button>
          <button
            onClick={() => setActiveTab('requirements')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'requirements'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Credit Requirements
          </button>
        </div>
      </div>

      {/* Course Registration Tab */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {/* Search and Filter */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button
                onClick={() => setShowFilterForm(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter Courses
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Courses List */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Available Courses</h2>
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 cursor-pointer transition-all hover:shadow-md ${
                    selectedCourse?.id === course.id ? 'ring-2 ring-primary-500' : ''
                  }`}
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{course.code}: {course.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{course.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                      {course.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      {course.instructor}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {course.schedule}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Award className="w-4 h-4 mr-2" />
                      {course.credits} Credits
                    </div>
                    <div className="flex items-center text-primary-600">
                      <ChevronRight className="w-4 h-4 mr-2" />
                      View Details
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Course Details */}
            <div className="space-y-6">
              {selectedCourse ? (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedCourse.code}</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Course Name</h4>
                      <p className="text-gray-600">{selectedCourse.name}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Instructor</h4>
                      <p className="text-gray-600">{selectedCourse.instructor}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Schedule</h4>
                      <p className="text-gray-600">{selectedCourse.schedule}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Credits</h4>
                      <p className="text-gray-600">{selectedCourse.credits} credits</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Description</h4>
                      <p className="text-gray-600">{selectedCourse.description}</p>
                    </div>
                    
                    <button
                      onClick={() => setShowRegistrationForm(true)}
                      className={`w-full py-2 rounded-lg transition-colors ${
                        selectedCourse.status === 'available'
                          ? 'bg-primary-600 text-white hover:bg-primary-700'
                          : selectedCourse.status === 'full'
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-yellow-500 text-white hover:bg-yellow-600'
                      }`}
                      disabled={selectedCourse.status === 'full'}
                    >
                      {selectedCourse.status === 'available' ? 'Register Now' :
                       selectedCourse.status === 'full' ? 'Course Full' :
                       'Prerequisites Required'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Select a course to view details</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Registrations</h3>
            {registrationsLoading ? (
              <p className="text-gray-600">Loading registrations...</p>
            ) : registrationsError ? (
              <p className="text-red-600">{registrationsError}</p>
            ) : registrations.length === 0 ? (
              <p className="text-gray-600">No course registrations submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {registrations.map((registration) => (
                  <div key={registration._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{registration.courseCode} - {registration.courseName}</p>
                        <p className="text-sm text-gray-600">Submitted: {new Date(registration.submittedAt).toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                        {registration.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Academic Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Academic Calendar</h2>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
                <button
                  onClick={() => setShowCalendarForm(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Calendar
                </button>
              </div>
              
              <div className="space-y-4">
                {ACADEMIC_EVENTS.map((event) => (
                  <div key={event.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                      {event.type.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{event.title}</h4>
                      <p className="text-gray-600 text-sm mt-1">{event.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(event.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credit Requirements Tab */}
      {activeTab === 'requirements' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Credit Requirements</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CREDIT_REQUIREMENTS.map((req) => (
              <div key={req.category} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{req.category}</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Required Credits</span>
                    <span className="font-medium">{req.required}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Completed</span>
                    <span className="font-medium text-green-600">{req.completed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remaining</span>
                    <span className="font-medium text-orange-600">{req.remaining}</span>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{Math.round((req.completed / req.required) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(req.completed / req.required) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Graduation Requirements</h3>
                <p className="text-blue-800 text-sm mt-1">
                  You need to complete 120 credits with a minimum GPA of 2.0 to graduate. 
                  You're currently on track with 75 credits completed and a GPA of 3.7.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AcademicSupport

