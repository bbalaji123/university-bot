import React, { useState, useEffect } from 'react'
import { 
  Building, 
  MapPin, 
  Clock, 
  Phone,
  Search,
  Navigation,
  Home,
  Bus,
  Wifi,
  Calendar,
  DollarSign
} from 'lucide-react'
import Modal from '../../components/Modal'

interface Hostel {
  id: string
  name: string
  type: 'boys' | 'girls' | 'co-ed'
  capacity: number
  available: number
  facilities: string[]
  fees: string
  image: string
}

interface TransportRoute {
  id: string
  route: string
  stops: string[]
  schedule: string
  fare: string
  frequency: string
}

interface CampusFacility {
  id: string
  name: string
  type: string
  hours: string
  location: string
  description: string
  contact: string
}

const HOSTELS: Hostel[] = [
  {
    id: '1',
    name: 'Sunshine Hostel Block A',
    type: 'boys',
    capacity: 200,
    available: 45,
    facilities: ['WiFi', 'Mess', 'Laundry', 'Gym', 'Study Room'],
    fees: '$1,200/semester',
    image: '/api/placeholder/300/200'
  },
  {
    id: '2',
    name: 'Rose Garden Hostel',
    type: 'girls',
    capacity: 180,
    available: 20,
    facilities: ['WiFi', 'Mess', 'Laundry', 'Library', 'Medical Room'],
    fees: '$1,200/semester',
    image: '/api/placeholder/300/200'
  },
  {
    id: '3',
    name: 'International Student House',
    type: 'co-ed',
    capacity: 100,
    available: 15,
    facilities: ['WiFi', 'Kitchen', 'Laundry', 'Gym', 'Common Room'],
    fees: '$1,500/semester',
    image: '/api/placeholder/300/200'
  },
  {
    id: '4',
    name: 'Sports Academy Hostel',
    type: 'boys',
    capacity: 150,
    available: 30,
    facilities: ['WiFi', 'Mess', 'Laundry', 'Sports Complex', 'Gym'],
    fees: '$1,100/semester',
    image: '/api/placeholder/300/200'
  }
]

const TRANSPORT_ROUTES: TransportRoute[] = [
  {
    id: '1',
    route: 'City Central - Campus',
    stops: ['City Central Station', 'Market Square', 'Hospital', 'Campus Gate'],
    schedule: '6:00 AM - 10:00 PM',
    fare: '$2.50',
    frequency: 'Every 30 minutes'
  },
  {
    id: '2',
    route: 'Airport Express',
    stops: ['International Airport', 'Business District', 'Campus'],
    schedule: '5:00 AM - 11:00 PM',
    fare: '$5.00',
    frequency: 'Every hour'
  },
  {
    id: '3',
    route: 'Metro Shuttle',
    stops: ['Metro Station A', 'Metro Station B', 'Campus North', 'Campus South'],
    schedule: '7:00 AM - 9:00 PM',
    fare: '$1.50',
    frequency: 'Every 20 minutes'
  }
]

const CAMPUS_FACILITIES: CampusFacility[] = [
  {
    id: '1',
    name: 'Central Library',
    type: 'Academic',
    hours: '8:00 AM - 10:00 PM',
    location: 'Building A, Ground Floor',
    description: '24/7 study space with extensive collection of books and digital resources.',
    contact: 'ext: 1234'
  },
  {
    id: '2',
    name: 'Student Health Center',
    type: 'Healthcare',
    hours: '9:00 AM - 6:00 PM',
    location: 'Building B, First Floor',
    description: 'Medical services, emergency care, and mental health support.',
    contact: 'ext: 5678'
  },
  {
    id: '3',
    name: 'Sports Complex',
    type: 'Recreation',
    hours: '6:00 AM - 9:00 PM',
    location: 'Campus West',
    description: 'Gym, swimming pool, basketball courts, and athletic fields.',
    contact: 'ext: 9012'
  },
  {
    id: '4',
    name: 'Career Services',
    type: 'Support',
    hours: '9:00 AM - 5:00 PM',
    location: 'Admin Building, Room 201',
    description: 'Career counseling, job placements, and internship opportunities.',
    contact: 'ext: 3456'
  }
]

const getTypeColor = (type: string) => {
  switch (type) {
    case 'boys': return 'bg-blue-100 text-blue-800'
    case 'girls': return 'bg-pink-100 text-pink-800'
    case 'co-ed': return 'bg-purple-100 text-purple-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const CampusSupport: React.FC = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<TransportRoute | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'hostel' | 'transport' | 'facilities' | 'navigation'>('hostel')
  const [showHostelForm, setShowHostelForm] = useState(false)
  const [showMapForm, setShowMapForm] = useState(false)
  const [mapAction, setMapAction] = useState<'find' | 'directions' | 'wifi'>('find')
  const [mapForm, setMapForm] = useState({
    query: '',
    fromLocation: '',
    toLocation: ''
  })
  const [hostelApplication, setHostelApplication] = useState({
    fullName: '',
    studentId: '',
    email: '',
    phone: '',
    moveInDate: '',
    notes: ''
  })
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [hostelApplications, setHostelApplications] = useState<any[]>([])
  const [mapRequests, setMapRequests] = useState<any[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordsError, setRecordsError] = useState('')

  const filteredHostels = HOSTELS.filter(hostel =>
    hostel.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const showNotificationWithTimeout = (message: string, durationMs: number) => {
    setNotificationMessage(message)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), durationMs)
  }

  const fetchCampusRecords = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setRecordsLoading(true)
      setRecordsError('')

      const [hostelRes, mapRes] = await Promise.all([
        fetch(`${apiBaseUrl}/campus/hostel-applications`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiBaseUrl}/campus/map-requests`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (!hostelRes.ok || !mapRes.ok) {
        throw new Error('Failed to load campus records')
      }

      const hostelData = await hostelRes.json()
      const mapData = await mapRes.json()

      setHostelApplications(hostelData.applications || [])
      setMapRequests(mapData.requests || [])
    } catch (error) {
      setRecordsError('Unable to load records from the server')
    } finally {
      setRecordsLoading(false)
    }
  }

  useEffect(() => {
    fetchCampusRecords()
  }, [])

  const handleOpenHostelForm = () => {
    if (!selectedHostel) {
      showNotificationWithTimeout('Select a hostel to apply', 3000)
      return
    }
    setShowHostelForm(true)
  }

  const handleSubmitHostelApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hostelApplication.fullName || !hostelApplication.studentId || !hostelApplication.email) {
      showNotificationWithTimeout('Please fill in all required fields', 3000)
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      showNotificationWithTimeout('Please login to submit your application', 3000)
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/campus/hostel-applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          hostelId: selectedHostel?.id,
          hostelName: selectedHostel?.name,
          ...hostelApplication
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit hostel application')
      }

      const data = await response.json()
      setHostelApplications(prev => [data.application, ...prev])
      showNotificationWithTimeout(`Hostel application submitted for ${selectedHostel?.name}`, 4000)
      setShowHostelForm(false)
      setHostelApplication({
        fullName: '',
        studentId: '',
        email: '',
        phone: '',
        moveInDate: '',
        notes: ''
      })
    } catch (error) {
      showNotificationWithTimeout('Failed to submit hostel application. Please try again.', 3000)
    }
  }

  const handleOpenMapAction = (type: 'find' | 'directions' | 'wifi', presetQuery?: string) => {
    setMapAction(type)
    setMapForm({
      query: presetQuery || '',
      fromLocation: '',
      toLocation: ''
    })
    setShowMapForm(true)
  }

  const handleSubmitMapAction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mapAction === 'directions' && (!mapForm.fromLocation || !mapForm.toLocation)) {
      showNotificationWithTimeout('Please enter start and destination', 3000)
      return
    }
    if (mapAction !== 'directions' && !mapForm.query) {
      showNotificationWithTimeout('Please enter a search value', 3000)
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      showNotificationWithTimeout('Please login to submit your request', 3000)
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/campus/map-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          requestType: mapAction,
          query: mapForm.query,
          fromLocation: mapForm.fromLocation,
          toLocation: mapForm.toLocation
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit map request')
      }

      const data = await response.json()
      setMapRequests(prev => [data.request, ...prev])
      const actionLabel = mapAction === 'find' ? 'Building search' : mapAction === 'wifi' ? 'WiFi zone search' : 'Directions'
      showNotificationWithTimeout(`${actionLabel} request submitted`, 3000)
      setShowMapForm(false)
    } catch (error) {
      showNotificationWithTimeout('Failed to submit map request. Please try again.', 3000)
    }
  }

  return (
    <div className="space-y-8">
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {notificationMessage}
        </div>
      )}

      {showHostelForm && selectedHostel && (
        <Modal
          title={`Apply for ${selectedHostel.name}`}
          onClose={() => setShowHostelForm(false)}
        >
          <form onSubmit={handleSubmitHostelApplication} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={hostelApplication.fullName}
                onChange={(e) => setHostelApplication(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
              <input
                type="text"
                value={hostelApplication.studentId}
                onChange={(e) => setHostelApplication(prev => ({ ...prev, studentId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={hostelApplication.email}
                onChange={(e) => setHostelApplication(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={hostelApplication.phone}
                onChange={(e) => setHostelApplication(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Move-in Date</label>
              <input
                type="date"
                value={hostelApplication.moveInDate}
                onChange={(e) => setHostelApplication(prev => ({ ...prev, moveInDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={hostelApplication.notes}
                onChange={(e) => setHostelApplication(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowHostelForm(false)}
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

      {showMapForm && (
        <Modal
          title={mapAction === 'find' ? 'Find Building' : mapAction === 'wifi' ? 'Find WiFi Zones' : 'Get Directions'}
          onClose={() => setShowMapForm(false)}
        >
          <form onSubmit={handleSubmitMapAction} className="space-y-4">
            {mapAction === 'directions' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From *</label>
                  <input
                    type="text"
                    value={mapForm.fromLocation}
                    onChange={(e) => setMapForm(prev => ({ ...prev, fromLocation: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To *</label>
                  <input
                    type="text"
                    value={mapForm.toLocation}
                    onChange={(e) => setMapForm(prev => ({ ...prev, toLocation: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search *</label>
                <input
                  type="text"
                  value={mapForm.query}
                  onChange={(e) => setMapForm(prev => ({ ...prev, query: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            )}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowMapForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Submit
              </button>
            </div>
          </form>
        </Modal>
      )}
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-8">
        <div className="flex items-center mb-4">
          <Building className="w-8 h-8 mr-3" />
          <h1 className="text-3xl font-bold">Campus Support</h1>
        </div>
        <p className="text-purple-100 text-lg mb-6">
          Hostel information, transportation schedules, and campus navigation
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center">
              <Home className="w-5 h-5 mr-2" />
              <span className="font-semibold">Hostel Capacity</span>
            </div>
            <p className="text-purple-100 mt-1">630 beds available</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center">
              <Bus className="w-5 h-5 mr-2" />
              <span className="font-semibold">Transport Routes</span>
            </div>
            <p className="text-purple-100 mt-1">15+ routes</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              <span className="font-semibold">Campus Size</span>
            </div>
            <p className="text-purple-100 mt-1">50 acres</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('hostel')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'hostel'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Hostel Information
          </button>
          <button
            onClick={() => setActiveTab('transport')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'transport'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Transportation
          </button>
          <button
            onClick={() => setActiveTab('facilities')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'facilities'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Campus Facilities
          </button>
          <button
            onClick={() => setActiveTab('navigation')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'navigation'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Campus Map
          </button>
        </div>
      </div>

      {/* Hostel Information Tab */}
      {activeTab === 'hostel' && (
        <div className="space-y-6">
          {/* Search */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search hostels..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Hostels List */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Available Hostels</h2>
              {filteredHostels.map((hostel) => (
                <div
                  key={hostel.id}
                  className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 cursor-pointer transition-all hover:shadow-md ${
                    selectedHostel?.id === hostel.id ? 'ring-2 ring-primary-500' : ''
                  }`}
                  onClick={() => setSelectedHostel(hostel)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{hostel.name}</h3>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(hostel.type)}`}>
                          {hostel.type.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600">
                          {hostel.available} of {hostel.capacity} available
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-primary-600">{hostel.fees}</p>
                      <p className="text-sm text-gray-500">per semester</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {hostel.facilities.map((facility, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Hostel Details */}
            <div className="space-y-6">
              {selectedHostel ? (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedHostel.name}</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-100 rounded-lg h-32 flex items-center justify-center">
                      <Building className="w-12 h-12 text-gray-400" />
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Hostel Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium">{selectedHostel.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Capacity:</span>
                          <span className="font-medium">{selectedHostel.capacity} students</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Available:</span>
                          <span className="font-medium text-green-600">{selectedHostel.available} beds</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fees:</span>
                          <span className="font-medium">{selectedHostel.fees}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Facilities</h4>
                      <div className="space-y-2">
                        {selectedHostel.facilities.map((facility, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 bg-primary-400 rounded-full mr-2"></div>
                            {facility}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <button
                      onClick={handleOpenHostelForm}
                      className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Apply for Hostel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <Home className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Select a hostel to view details</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Hostel Applications</h3>
            {recordsLoading ? (
              <p className="text-gray-600">Loading applications...</p>
            ) : recordsError ? (
              <p className="text-red-600">{recordsError}</p>
            ) : hostelApplications.length === 0 ? (
              <p className="text-gray-600">No hostel applications submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {hostelApplications.map((application) => (
                  <div key={application._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{application.hostelName}</p>
                        <p className="text-sm text-gray-600">Submitted: {new Date(application.submittedAt).toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                        {application.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transportation Tab */}
      {activeTab === 'transport' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Transportation Services</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TRANSPORT_ROUTES.map((route) => (
              <div
                key={route.id}
                className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 cursor-pointer transition-all hover:shadow-md ${
                  selectedRoute?.id === route.id ? 'ring-2 ring-primary-500' : ''
                }`}
                onClick={() => setSelectedRoute(route)}
              >
                <div className="flex items-center mb-4">
                  <Bus className="w-6 h-6 text-primary-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">{route.route}</h3>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    {route.schedule}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    {route.frequency}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2" />
                    {route.fare}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-2">Major Stops:</p>
                  <div className="flex flex-wrap gap-1">
                    {route.stops.map((stop, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {stop}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Transport Office</h3>
                <p className="text-blue-800 text-sm mt-1">
                  For transportation queries and route information, contact the transport office at ext: 7777 or email transport@university.edu
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campus Facilities Tab */}
      {activeTab === 'facilities' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Campus Facilities</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CAMPUS_FACILITIES.map((facility) => (
              <div key={facility.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{facility.name}</h3>
                    <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-xs mt-1 inline-block">
                      {facility.type}
                    </span>
                  </div>
                  <Building className="w-6 h-6 text-gray-400" />
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{facility.description}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    {facility.hours}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {facility.location}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {facility.contact}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campus Navigation Tab */}
      {activeTab === 'navigation' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Campus Navigation</h2>
          
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center mb-6">
                <div className="text-center">
                  <Navigation className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Interactive Campus Map</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => handleOpenMapAction('find')}
                  className="p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <MapPin className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Find Building</p>
                </button>
                <button
                  onClick={() => handleOpenMapAction('directions')}
                  className="p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Navigation className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Get Directions</p>
                </button>
                <button
                  onClick={() => handleOpenMapAction('wifi')}
                  className="p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Wifi className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">WiFi Zones</p>
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Quick Access</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <button
                    onClick={() => handleOpenMapAction('find', 'Library')}
                    className="p-2 text-left hover:bg-white rounded transition-colors"
                  >
                    Library
                  </button>
                  <button
                    onClick={() => handleOpenMapAction('find', 'Cafeteria')}
                    className="p-2 text-left hover:bg-white rounded transition-colors"
                  >
                    Cafeteria
                  </button>
                  <button
                    onClick={() => handleOpenMapAction('find', 'Sports Complex')}
                    className="p-2 text-left hover:bg-white rounded transition-colors"
                  >
                    Sports Complex
                  </button>
                  <button
                    onClick={() => handleOpenMapAction('find', 'Admin Block')}
                    className="p-2 text-left hover:bg-white rounded transition-colors"
                  >
                    Admin Block
                  </button>
                  <button
                    onClick={() => handleOpenMapAction('find', 'Health Center')}
                    className="p-2 text-left hover:bg-white rounded transition-colors"
                  >
                    Health Center
                  </button>
                  <button
                    onClick={() => handleOpenMapAction('find', 'Parking Areas')}
                    className="p-2 text-left hover:bg-white rounded transition-colors"
                  >
                    Parking Areas
                  </button>
                  <button
                    onClick={() => handleOpenMapAction('find', 'Lecture Halls')}
                    className="p-2 text-left hover:bg-white rounded transition-colors"
                  >
                    Lecture Halls
                  </button>
                  <button
                    onClick={() => handleOpenMapAction('find', 'Emergency Exits')}
                    className="p-2 text-left hover:bg-white rounded transition-colors"
                  >
                    Emergency Exits
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Map Requests</h3>
            {recordsLoading ? (
              <p className="text-gray-600">Loading requests...</p>
            ) : recordsError ? (
              <p className="text-red-600">{recordsError}</p>
            ) : mapRequests.length === 0 ? (
              <p className="text-gray-600">No map requests submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {mapRequests.map((request) => (
                  <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{request.requestType.toUpperCase()}</p>
                        <p className="text-sm text-gray-600">Submitted: {new Date(request.submittedAt).toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                        Saved
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CampusSupport

