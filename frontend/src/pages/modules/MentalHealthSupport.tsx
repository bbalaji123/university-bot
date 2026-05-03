import React, { useState, useEffect } from 'react'
import { 
  Heart, 
  Calendar, 
  Users, 
  Phone, 
  MessageCircle,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Brain,
  Smile,
  Activity
} from 'lucide-react'
import Modal from '../../components/Modal'

interface Counselor {
  id: string
  name: string
  specialization: string[]
  experience: string
  languages: string[]
  available: boolean
  rating: number
  nextAvailable: string
}

interface Resource {
  id: string
  title: string
  type: 'article' | 'video' | 'workshop' | 'app'
  category: string
  duration: string
  description: string
}

interface SupportGroup {
  id: string
  name: string
  topic: string
  schedule: string
  facilitator: string
  participants: number
  maxParticipants: number
}

const COUNSELORS: Counselor[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    specialization: ['Anxiety', 'Depression', 'Stress Management'],
    experience: '10+ years',
    languages: ['English', 'Spanish'],
    available: true,
    rating: 4.8,
    nextAvailable: 'Today, 2:00 PM'
  },
  {
    id: '2',
    name: 'Dr. Michael Chen',
    specialization: ['Academic Stress', 'Time Management', 'Career Counseling'],
    experience: '8+ years',
    languages: ['English', 'Mandarin'],
    available: true,
    rating: 4.9,
    nextAvailable: 'Tomorrow, 10:00 AM'
  },
  {
    id: '3',
    name: 'Dr. Emily Davis',
    specialization: ['Relationship Issues', 'Self-Esteem', 'Trauma'],
    experience: '12+ years',
    languages: ['English', 'French'],
    available: false,
    rating: 4.7,
    nextAvailable: 'Next Week'
  },
  {
    id: '4',
    name: 'Dr. Robert Wilson',
    specialization: ['Addiction', 'Anger Management', 'Family Therapy'],
    experience: '15+ years',
    languages: ['English', 'German'],
    available: true,
    rating: 4.6,
    nextAvailable: 'Friday, 3:00 PM'
  }
]

const RESOURCES: Resource[] = [
  {
    id: '1',
    title: 'Managing Exam Stress',
    type: 'article',
    category: 'Stress Management',
    duration: '5 min read',
    description: 'Practical tips for dealing with academic pressure and exam anxiety.'
  },
  {
    id: '2',
    title: 'Mindfulness Meditation',
    type: 'video',
    category: 'Meditation',
    duration: '15 min',
    description: 'Guided meditation session for relaxation and mental clarity.'
  },
  {
    id: '3',
    title: 'Building Resilience Workshop',
    type: 'workshop',
    category: 'Personal Development',
    duration: '2 hours',
    description: 'Interactive workshop on developing psychological resilience.'
  },
  {
    id: '4',
    title: 'Calm App',
    type: 'app',
    category: 'Digital Tools',
    duration: 'On-demand',
    description: 'Meditation and sleep app for daily mental wellness.'
  }
]

const SUPPORT_GROUPS: SupportGroup[] = [
  {
    id: '1',
    name: 'Anxiety Support Circle',
    topic: 'Anxiety Management',
    schedule: 'Every Tuesday, 4:00 PM',
    facilitator: 'Dr. Sarah Johnson',
    participants: 8,
    maxParticipants: 12
  },
  {
    id: '2',
    name: 'International Students Group',
    topic: 'Cultural Adaptation',
    schedule: 'Every Wednesday, 6:00 PM',
    facilitator: 'Dr. Michael Chen',
    participants: 10,
    maxParticipants: 15
  },
  {
    id: '3',
    name: 'Study Skills & Time Management',
    topic: 'Academic Success',
    schedule: 'Every Thursday, 5:00 PM',
    facilitator: 'Dr. Emily Davis',
    participants: 6,
    maxParticipants: 10
  }
]

const EMERGENCY_CONTACTS = [
  { service: '24/7 Crisis Hotline', number: '1-800-273-8255', description: 'Immediate emotional support' },
  { service: 'Campus Emergency', number: '911', description: 'For life-threatening emergencies' },
  { service: 'Campus Security', number: '(555) 123-4567', description: '24/7 campus safety support' },
  { service: 'Health Center', number: '(555) 987-6543', description: 'Medical and mental health services' }
]

const getTypeColor = (type: string) => {
  switch (type) {
    case 'article': return 'bg-blue-100 text-blue-800'
    case 'video': return 'bg-red-100 text-red-800'
    case 'workshop': return 'bg-green-100 text-green-800'
    case 'app': return 'bg-purple-100 text-purple-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const MentalHealthSupport: React.FC = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'counseling' | 'resources' | 'groups' | 'emergency'>('counseling')
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [showResourceForm, setShowResourceForm] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<SupportGroup | null>(null)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [appointmentData, setAppointmentData] = useState({
    fullName: '',
    email: '',
    phone: '',
    preferredDate: '',
    concerns: ''
  })
  const [groupJoinData, setGroupJoinData] = useState({
    fullName: '',
    email: '',
    notes: ''
  })
  const [resourceAccessData, setResourceAccessData] = useState({
    fullName: '',
    email: ''
  })
  const [appointments, setAppointments] = useState<any[]>([])
  const [groupRequests, setGroupRequests] = useState<any[]>([])
  const [resourceRequests, setResourceRequests] = useState<any[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordsError, setRecordsError] = useState('')

  const filteredCounselors = COUNSELORS.filter(counselor =>
    counselor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    counselor.specialization.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const showNotificationWithTimeout = (message: string, durationMs: number) => {
    setNotificationMessage(message)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), durationMs)
  }

  const fetchMentalHealthRecords = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setRecordsLoading(true)
      setRecordsError('')

      const [appointmentsRes, groupsRes, resourcesRes] = await Promise.all([
        fetch(`${apiBaseUrl}/mental-health/appointments`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiBaseUrl}/mental-health/groups`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiBaseUrl}/mental-health/resources`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (!appointmentsRes.ok || !groupsRes.ok || !resourcesRes.ok) {
        throw new Error('Failed to load records')
      }

      const appointmentsData = await appointmentsRes.json()
      const groupsData = await groupsRes.json()
      const resourcesData = await resourcesRes.json()

      setAppointments(appointmentsData.appointments || [])
      setGroupRequests(groupsData.joins || [])
      setResourceRequests(resourcesData.requests || [])
    } catch (error) {
      setRecordsError('Unable to load records from the server')
    } finally {
      setRecordsLoading(false)
    }
  }

  useEffect(() => {
    fetchMentalHealthRecords()
  }, [])

  const handleOpenAppointmentForm = () => {
    if (!selectedCounselor) {
      showNotificationWithTimeout('Select a counselor to book an appointment', 3000)
      return
    }
    if (!selectedCounselor.available) {
      showNotificationWithTimeout('This counselor is currently unavailable', 3000)
      return
    }
    setShowAppointmentForm(true)
  }

  const handleSubmitAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appointmentData.fullName || !appointmentData.email || !appointmentData.preferredDate) {
      showNotificationWithTimeout('Please fill in all required fields', 3000)
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      showNotificationWithTimeout('Please login to submit your request', 3000)
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/mental-health/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          counselorId: selectedCounselor?.id,
          counselorName: selectedCounselor?.name,
          ...appointmentData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit appointment')
      }

      const data = await response.json()
      setAppointments(prev => [data.appointment, ...prev])
      showNotificationWithTimeout(`Appointment request sent to ${selectedCounselor?.name}`, 4000)
      setShowAppointmentForm(false)
      setAppointmentData({ fullName: '', email: '', phone: '', preferredDate: '', concerns: '' })
    } catch (error) {
      showNotificationWithTimeout('Failed to submit appointment. Please try again.', 3000)
    }
  }

  const handleOpenGroupForm = (group: SupportGroup) => {
    setSelectedGroup(group)
    setShowGroupForm(true)
  }

  const handleSubmitGroupJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupJoinData.fullName || !groupJoinData.email) {
      showNotificationWithTimeout('Please fill in your name and email', 3000)
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      showNotificationWithTimeout('Please login to submit your request', 3000)
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/mental-health/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          groupId: selectedGroup?.id,
          groupName: selectedGroup?.name,
          ...groupJoinData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit group request')
      }

      const data = await response.json()
      setGroupRequests(prev => [data.joinRequest, ...prev])
      showNotificationWithTimeout(`Join request submitted for ${selectedGroup?.name}`, 4000)
      setShowGroupForm(false)
      setSelectedGroup(null)
      setGroupJoinData({ fullName: '', email: '', notes: '' })
    } catch (error) {
      showNotificationWithTimeout('Failed to submit group request. Please try again.', 3000)
    }
  }

  const handleOpenResourceForm = (resource: Resource) => {
    setSelectedResource(resource)
    setShowResourceForm(true)
  }

  const handleSubmitResourceAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resourceAccessData.fullName || !resourceAccessData.email) {
      showNotificationWithTimeout('Please fill in your name and email', 3000)
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      showNotificationWithTimeout('Please login to submit your request', 3000)
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/mental-health/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          resourceId: selectedResource?.id,
          resourceTitle: selectedResource?.title,
          ...resourceAccessData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit resource request')
      }

      const data = await response.json()
      setResourceRequests(prev => [data.accessRequest, ...prev])
      showNotificationWithTimeout(`Access request submitted for ${selectedResource?.title}`, 4000)
      setShowResourceForm(false)
      setSelectedResource(null)
      setResourceAccessData({ fullName: '', email: '' })
    } catch (error) {
      showNotificationWithTimeout('Failed to submit resource request. Please try again.', 3000)
    }
  }

  return (
    <div className="space-y-8">
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {notificationMessage}
        </div>
      )}

      {showAppointmentForm && selectedCounselor && (
        <Modal
          title={`Book Appointment - ${selectedCounselor.name}`}
          onClose={() => setShowAppointmentForm(false)}
        >
          <form onSubmit={handleSubmitAppointment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={appointmentData.fullName}
                onChange={(e) => setAppointmentData(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={appointmentData.email}
                onChange={(e) => setAppointmentData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={appointmentData.phone}
                onChange={(e) => setAppointmentData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date *</label>
              <input
                type="datetime-local"
                value={appointmentData.preferredDate}
                onChange={(e) => setAppointmentData(prev => ({ ...prev, preferredDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Concerns</label>
              <textarea
                value={appointmentData.concerns}
                onChange={(e) => setAppointmentData(prev => ({ ...prev, concerns: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAppointmentForm(false)}
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

      {showGroupForm && selectedGroup && (
        <Modal
          title={`Join ${selectedGroup.name}`}
          onClose={() => setShowGroupForm(false)}
        >
          <form onSubmit={handleSubmitGroupJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={groupJoinData.fullName}
                onChange={(e) => setGroupJoinData(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={groupJoinData.email}
                onChange={(e) => setGroupJoinData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={groupJoinData.notes}
                onChange={(e) => setGroupJoinData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowGroupForm(false)}
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

      {showResourceForm && selectedResource && (
        <Modal
          title={`Access ${selectedResource.title}`}
          onClose={() => setShowResourceForm(false)}
        >
          <form onSubmit={handleSubmitResourceAccess} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={resourceAccessData.fullName}
                onChange={(e) => setResourceAccessData(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={resourceAccessData.email}
                onChange={(e) => setResourceAccessData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResourceForm(false)}
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
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl p-8">
        <div className="flex items-center mb-4">
          <Heart className="w-8 h-8 mr-3" />
          <h1 className="text-3xl font-bold">Mental Health Support</h1>
        </div>
        <p className="text-red-100 text-lg mb-6">
          Counseling appointments and stress management resources
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              <span className="font-semibold">Licensed Counselors</span>
            </div>
            <p className="text-red-100 mt-1">12 professionals</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              <span className="font-semibold">24/7 Support</span>
            </div>
            <p className="text-red-100 mt-1">Always available</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              <span className="font-semibold">Resources</span>
            </div>
            <p className="text-red-100 mt-1">100+ materials</p>
          </div>
        </div>
      </div>

      {/* Emergency Alert */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">If you're in crisis</h3>
            <p className="text-red-800 text-sm mt-1">
              If you're having thoughts of self-harm or need immediate support, please call the 24/7 crisis hotline at 1-800-273-8255
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('counseling')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'counseling'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Counseling Services
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'resources'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Self-Help Resources
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'groups'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Support Groups
          </button>
          <button
            onClick={() => setActiveTab('emergency')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'emergency'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Emergency Contacts
          </button>
        </div>
      </div>

      {/* Counseling Services Tab */}
      {activeTab === 'counseling' && (
        <div className="space-y-6">
          {/* Search */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search counselors by name or specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Counselors List */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Available Counselors</h2>
              {filteredCounselors.map((counselor) => (
                <div
                  key={counselor.id}
                  className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 cursor-pointer transition-all hover:shadow-md ${
                    selectedCounselor?.id === counselor.id ? 'ring-2 ring-primary-500' : ''
                  }`}
                  onClick={() => setSelectedCounselor(counselor)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{counselor.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{counselor.experience} experience</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">★</span>
                        <span className="font-medium">{counselor.rating}</span>
                      </div>
                      <span className={`inline-block w-2 h-2 rounded-full mt-2 ${
                        counselor.available ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">Specialization:</p>
                      <div className="flex flex-wrap gap-2">
                        {counselor.specialization.map((spec, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        {counselor.languages.join(', ')}
                      </div>
                      <div className="text-primary-600 font-medium">
                        {counselor.nextAvailable}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Counselor Details */}
            <div className="space-y-6">
              {selectedCounselor ? (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedCounselor.name}</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">Rating:</span>
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">★</span>
                        <span className="font-medium">{selectedCounselor.rating}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Specialization</h4>
                      <div className="space-y-1">
                        {selectedCounselor.specialization.map((spec, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            {spec}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Languages</h4>
                      <p className="text-gray-600">{selectedCounselor.languages.join(', ')}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Experience</h4>
                      <p className="text-gray-600">{selectedCounselor.experience}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Availability</h4>
                      <p className={`font-medium ${
                        selectedCounselor.available ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedCounselor.available ? 'Available' : 'Currently Unavailable'}
                      </p>
                      <p className="text-sm text-gray-600">Next: {selectedCounselor.nextAvailable}</p>
                    </div>
                    
                    <button
                      onClick={handleOpenAppointmentForm}
                      className={`w-full py-2 rounded-lg transition-colors ${
                        selectedCounselor.available
                          ? 'bg-primary-600 text-white hover:bg-primary-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!selectedCounselor.available}
                    >
                      {selectedCounselor.available ? 'Book Appointment' : 'Currently Unavailable'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Select a counselor to view details</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Appointments</h3>
            {recordsLoading ? (
              <p className="text-gray-600">Loading appointments...</p>
            ) : recordsError ? (
              <p className="text-red-600">{recordsError}</p>
            ) : appointments.length === 0 ? (
              <p className="text-gray-600">No appointment requests submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div key={appointment._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{appointment.counselorName}</p>
                        <p className="text-sm text-gray-600">Preferred: {appointment.preferredDate}</p>
                      </div>
                      <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Self-Help Resources Tab */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Self-Help Resources</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {RESOURCES.map((resource) => (
              <div key={resource.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(resource.type)}`}>
                    {resource.type.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">{resource.duration}</span>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2">{resource.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{resource.category}</span>
                  <button
                    onClick={() => handleOpenResourceForm(resource)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Access →
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Resource Requests</h3>
            {recordsLoading ? (
              <p className="text-gray-600">Loading requests...</p>
            ) : recordsError ? (
              <p className="text-red-600">{recordsError}</p>
            ) : resourceRequests.length === 0 ? (
              <p className="text-gray-600">No resource requests submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {resourceRequests.map((request) => (
                  <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{request.resourceTitle}</p>
                        <p className="text-sm text-gray-600">Submitted: {new Date(request.submittedAt).toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-800">Submitted</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Support Groups Tab */}
      {activeTab === 'groups' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Support Groups</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SUPPORT_GROUPS.map((group) => (
              <div key={group.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center mb-4">
                  <Users className="w-6 h-6 text-primary-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Topic:</p>
                    <p className="text-gray-600">{group.topic}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900">Schedule:</p>
                    <p className="text-gray-600">{group.schedule}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900">Facilitator:</p>
                    <p className="text-gray-600">{group.facilitator}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-1" />
                      {group.participants}/{group.maxParticipants}
                    </div>
                    <button
                      onClick={() => handleOpenGroupForm(group)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                    >
                      Join Group
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Group Requests</h3>
            {recordsLoading ? (
              <p className="text-gray-600">Loading requests...</p>
            ) : recordsError ? (
              <p className="text-red-600">{recordsError}</p>
            ) : groupRequests.length === 0 ? (
              <p className="text-gray-600">No group requests submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {groupRequests.map((request) => (
                  <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{request.groupName}</p>
                        <p className="text-sm text-gray-600">Submitted: {new Date(request.submittedAt).toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                        {request.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emergency Contacts Tab */}
      {activeTab === 'emergency' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Emergency Contacts</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {EMERGENCY_CONTACTS.map((contact, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-start space-x-4">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <Phone className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{contact.service}</h3>
                    <p className="text-2xl font-bold text-red-600 my-2">{contact.number}</p>
                    <p className="text-gray-600 text-sm">{contact.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-yellow-50 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900">Important Information</h3>
                <p className="text-yellow-800 text-sm mt-1">
                  All counseling services are strictly confidential. If you or someone you know is in immediate danger, 
                  please call 911 or visit the nearest emergency room.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MentalHealthSupport

