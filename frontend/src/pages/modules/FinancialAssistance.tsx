import React, { useState, useEffect } from 'react'
import { 
  DollarSign, 
  CreditCard, 
  Award, 
  FileText, 
  Calendar,
  Search,
  Filter,
  Download,
  Calculator,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  BookOpen,
  X
} from 'lucide-react'
import Modal from '../../components/Modal'

interface Scholarship {
  id: string
  name: string
  amount: string
  eligibility: string[]
  deadline: string
  status: 'open' | 'closing-soon' | 'closed'
  category: 'merit' | 'need' | 'sports' | 'specific'
  description: string
}

interface PaymentPlan {
  id: string
  name: string
  amount: string
  frequency: string
  description: string
  benefits: string[]
}

const SCHOLARSHIPS: Scholarship[] = [
  {
    id: '1',
    name: 'Academic Excellence Scholarship',
    amount: '$5,000 - $10,000',
    eligibility: ['GPA 3.5+', 'Full-time enrollment', 'Minimum 30 credits completed'],
    deadline: '2024-05-15',
    status: 'open',
    category: 'merit',
    description: 'Awarded to students with outstanding academic performance.'
  },
  {
    id: '2',
    name: 'Need-Based Financial Aid',
    amount: '$2,000 - $8,000',
    eligibility: ['Family income < $50,000', 'FAFSA completed', 'Satisfactory academic progress'],
    deadline: '2024-04-30',
    status: 'closing-soon',
    category: 'need',
    description: 'Financial assistance based on demonstrated financial need.'
  },
  {
    id: '3',
    name: 'Athletic Scholarship',
    amount: '$3,000 - $15,000',
    eligibility: ['Varsity team member', 'Minimum GPA 2.5', 'Coach recommendation'],
    deadline: '2024-06-01',
    status: 'open',
    category: 'sports',
    description: 'Support for student-athletes participating in varsity sports.'
  },
  {
    id: '4',
    name: 'STEM Innovation Grant',
    amount: '$4,000 - $12,000',
    eligibility: ['STEM major', 'Research project proposal', 'Faculty mentor'],
    deadline: '2024-07-15',
    status: 'open',
    category: 'specific',
    description: 'Funding for innovative research projects in STEM fields.'
  }
]

const PAYMENT_PLANS: PaymentPlan[] = [
  {
    id: '1',
    name: 'Semester Payment Plan',
    amount: '$6,000 per semester',
    frequency: '2 payments per year',
    description: 'Pay tuition in two installments per academic year.',
    benefits: ['No interest charges', 'Flexible payment dates', 'Online payment options']
  },
  {
    id: '2',
    name: 'Monthly Installment Plan',
    amount: '$1,000 per month',
    frequency: '12 payments per year',
    description: 'Spread tuition payments over 12 monthly installments.',
    benefits: ['Smaller monthly payments', 'Automatic payment option', 'Payment reminders']
  },
  {
    id: '3',
    name: 'Early Bird Discount',
    amount: '$10,800 (10% discount)',
    frequency: 'One payment per year',
    description: 'Pay full annual tuition upfront and receive 10% discount.',
    benefits: ['10% discount', 'No payment processing fees', 'Priority registration']
  }
]

const LOAN_OPTIONS = [
  {
    type: 'Federal Student Loans',
    description: 'Government-backed loans with favorable terms and interest rates.',
    features: ['Low interest rates', 'Deferred payments until graduation', 'Income-driven repayment plans'],
    maxAmount: '$12,500 per year'
  },
  {
    type: 'Private Student Loans',
    description: 'Loans from private banks and financial institutions.',
    features: ['Higher borrowing limits', 'Quick approval process', 'Flexible repayment terms'],
    maxAmount: '$25,000 per year'
  },
  {
    type: 'Parent PLUS Loans',
    description: 'Loans available to parents of dependent undergraduate students.',
    features: ['Fixed interest rates', 'Multiple repayment options', 'Credit-based approval'],
    maxAmount: 'Cost of attendance'
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

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'merit': return 'bg-blue-100 text-blue-800'
    case 'need': return 'bg-green-100 text-green-800'
    case 'sports': return 'bg-purple-100 text-purple-800'
    case 'specific': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const FinancialAssistance: React.FC = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'scholarships' | 'payment' | 'loans'>('scholarships')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'merit' | 'need' | 'sports' | 'specific'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closing-soon' | 'closed'>('all')
  const [showFilterForm, setShowFilterForm] = useState(false)
  const [showPaymentPlanForm, setShowPaymentPlanForm] = useState(false)
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<PaymentPlan | null>(null)
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [applicationData, setApplicationData] = useState({
    fullName: '',
    email: '',
    phone: '',
    studentId: '',
    scholarshipId: '',
    financialNeed: '',
    gpa: '',
    essay: ''
  })
  const [applications, setApplications] = useState<any[]>([])
  const [savedScholarships, setSavedScholarships] = useState<any[]>([])
  const [paymentPlanData, setPaymentPlanData] = useState({
    fullName: '',
    studentId: '',
    email: '',
    paymentMethod: ''
  })
  const [scholarshipSubmissions, setScholarshipSubmissions] = useState<any[]>([])
  const [paymentPlanRequests, setPaymentPlanRequests] = useState<any[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordsError, setRecordsError] = useState('')

  const filteredScholarships = SCHOLARSHIPS.filter(scholarship => {
    const matchesSearch = scholarship.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || scholarship.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || scholarship.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const showNotificationWithTimeout = (message: string, durationMs: number) => {
    setNotificationMessage(message)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), durationMs)
  }

  const fetchFinancialRecords = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setRecordsLoading(true)
      setRecordsError('')

      const [scholarshipRes, planRes] = await Promise.all([
        fetch(`${apiBaseUrl}/financial/scholarships`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiBaseUrl}/financial/payment-plans`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (!scholarshipRes.ok || !planRes.ok) {
        throw new Error('Failed to load financial records')
      }

      const scholarshipData = await scholarshipRes.json()
      const planData = await planRes.json()

      setScholarshipSubmissions(scholarshipData.applications || [])
      setPaymentPlanRequests(planData.requests || [])
    } catch (error) {
      setRecordsError('Unable to load records from the server')
    } finally {
      setRecordsLoading(false)
    }
  }

  useEffect(() => {
    fetchFinancialRecords()
  }, [])

  // Handler functions
  const handleScholarshipSelect = (scholarship: Scholarship) => {
    setSelectedScholarship(scholarship)
    setApplicationData(prev => ({ ...prev, scholarshipId: scholarship.id }))
  }

  const handleApplyForScholarship = () => {
    if (selectedScholarship) {
      setShowApplicationForm(true)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement
    const { name, value } = target
    setApplicationData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!applicationData.fullName || !applicationData.email || !applicationData.studentId) {
      showNotificationWithTimeout('Please fill in all required fields', 3000)
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      showNotificationWithTimeout('Please login to submit your application', 3000)
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/financial/scholarships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...applicationData,
          scholarshipId: selectedScholarship?.id,
          scholarshipName: selectedScholarship?.name
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit scholarship')
      }

      const data = await response.json()
      setApplications(prev => [...prev, data.application])
      setScholarshipSubmissions(prev => [data.application, ...prev])
      showNotificationWithTimeout(`Scholarship application submitted successfully for ${selectedScholarship?.name}!`, 5000)
      setShowApplicationForm(false)

      setApplicationData({
        fullName: '',
        email: '',
        phone: '',
        studentId: '',
        scholarshipId: '',
        financialNeed: '',
        gpa: '',
        essay: ''
      })
    } catch (error) {
      showNotificationWithTimeout('Failed to submit scholarship application. Please try again.', 3000)
    }
  }

  const handleSaveScholarship = (scholarship: Scholarship) => {
    const exists = savedScholarships.find((s: any) => s.id === scholarship.id)
    
    if (!exists) {
      setSavedScholarships(prev => [...prev, scholarship])
      localStorage.setItem('savedScholarships', JSON.stringify([...savedScholarships, scholarship]))
      showNotificationWithTimeout(`${scholarship.name} saved to your scholarships!`, 3000)
    } else {
      showNotificationWithTimeout(`${scholarship.name} is already saved!`, 3000)
    }
  }

  const handleDownloadInfo = (type: string) => {
    showNotificationWithTimeout(`Downloading ${type} information...`, 2000)
  }

  const handlePaymentPlan = (plan: PaymentPlan) => {
    setSelectedPaymentPlan(plan)
    setShowPaymentPlanForm(true)
  }

  const handleSubmitPaymentPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentPlanData.fullName || !paymentPlanData.studentId || !paymentPlanData.email) {
      showNotificationWithTimeout('Please fill in all required fields', 3000)
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      showNotificationWithTimeout('Please login to submit your request', 3000)
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/financial/payment-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: selectedPaymentPlan?.id,
          planName: selectedPaymentPlan?.name,
          ...paymentPlanData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit payment plan')
      }

      const data = await response.json()
      setPaymentPlanRequests(prev => [data.request, ...prev])
      showNotificationWithTimeout(`Payment plan request submitted: ${selectedPaymentPlan?.name}`, 4000)
      setShowPaymentPlanForm(false)
      setSelectedPaymentPlan(null)
      setPaymentPlanData({ fullName: '', studentId: '', email: '', paymentMethod: '' })
    } catch (error) {
      showNotificationWithTimeout('Failed to submit payment plan. Please try again.', 3000)
    }
  }

  const handleSubmitFilter = (e: React.FormEvent) => {
    e.preventDefault()
    setShowFilterForm(false)
    showNotificationWithTimeout('Scholarship filters applied', 2000)
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
      {showApplicationForm && selectedScholarship && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Apply for {selectedScholarship.name}</h3>
              <button
                onClick={() => setShowApplicationForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={applicationData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={applicationData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                <input
                  type="text"
                  name="studentId"
                  value={applicationData.studentId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current GPA</label>
                <input
                  type="text"
                  name="gpa"
                  value={applicationData.gpa}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Financial Need</label>
                <textarea
                  name="financialNeed"
                  value={applicationData.financialNeed}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application Essay</label>
                <textarea
                  name="essay"
                  value={applicationData.essay}
                  onChange={handleInputChange}
                  rows={4}
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
          </div>
        </div>
      )}

      {showFilterForm && (
        <Modal
          title="Filter Scholarships"
          onClose={() => setShowFilterForm(false)}
        >
          <form onSubmit={handleSubmitFilter} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All</option>
                <option value="merit">Merit</option>
                <option value="need">Need</option>
                <option value="sports">Sports</option>
                <option value="specific">Specific</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="closing-soon">Closing Soon</option>
                <option value="closed">Closed</option>
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

      {showPaymentPlanForm && selectedPaymentPlan && (
        <Modal
          title={`Select ${selectedPaymentPlan.name}`}
          onClose={() => setShowPaymentPlanForm(false)}
        >
          <form onSubmit={handleSubmitPaymentPlan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={paymentPlanData.fullName}
                onChange={(e) => setPaymentPlanData(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
              <input
                type="text"
                value={paymentPlanData.studentId}
                onChange={(e) => setPaymentPlanData(prev => ({ ...prev, studentId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={paymentPlanData.email}
                onChange={(e) => setPaymentPlanData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Payment Method</label>
              <input
                type="text"
                value={paymentPlanData.paymentMethod}
                onChange={(e) => setPaymentPlanData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Card, bank transfer, etc."
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentPlanForm(false)}
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

      <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl p-8">
        <div className="flex items-center mb-4">
          <DollarSign className="w-8 h-8 mr-3" />
          <h1 className="text-3xl font-bold">Financial Assistance</h1>
        </div>
        <p className="text-yellow-100 text-lg mb-6">
          Fee payment information, scholarship guidance, and loan assistance
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              <span className="font-semibold">Annual Tuition</span>
            </div>
            <p className="text-yellow-100 mt-1">$12,000</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center">
              <Award className="w-5 h-5 mr-2" />
              <span className="font-semibold">Scholarships Available</span>
            </div>
            <p className="text-yellow-100 mt-1">50+ programs</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              <span className="font-semibold">Average Aid Award</span>
            </div>
            <p className="text-yellow-100 mt-1">$7,500</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('scholarships')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'scholarships'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Scholarships
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'payment'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Payment Plans
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'loans'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Student Loans
          </button>
        </div>
      </div>

      {/* Scholarships Tab */}
      {activeTab === 'scholarships' && (
        <div className="space-y-6">
          {/* Search and Filter */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search scholarships..."
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
                Filter
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Scholarships List */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Available Scholarships</h2>
              {filteredScholarships.map((scholarship) => (
                <div
                  key={scholarship.id}
                  className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 cursor-pointer transition-all hover:shadow-md ${
                    selectedScholarship?.id === scholarship.id ? 'ring-2 ring-primary-500' : ''
                  }`}
                  onClick={() => handleScholarshipSelect(scholarship)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{scholarship.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{scholarship.description}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(scholarship.status)}`}>
                        {scholarship.status.replace('-', ' ').toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(scholarship.category)}`}>
                        {scholarship.category.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2" />
                      {scholarship.amount}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      Deadline: {new Date(scholarship.deadline).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Scholarship Details */}
            <div className="space-y-6">
              {selectedScholarship ? (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedScholarship.name}</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Award Amount</h4>
                      <p className="text-gray-600">{selectedScholarship.amount}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Eligibility Requirements</h4>
                      <ul className="space-y-2">
                        {selectedScholarship.eligibility.map((req, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Application Deadline</h4>
                      <p className="text-gray-600">{new Date(selectedScholarship.deadline).toLocaleDateString()}</p>
                    </div>
                    
                    <button 
                    onClick={handleApplyForScholarship}
                    className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Apply Now
                  </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Select a scholarship to view details</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Scholarship Applications</h3>
            {recordsLoading ? (
              <p className="text-gray-600">Loading applications...</p>
            ) : recordsError ? (
              <p className="text-red-600">{recordsError}</p>
            ) : scholarshipSubmissions.length === 0 ? (
              <p className="text-gray-600">No scholarship applications submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {scholarshipSubmissions.map((application) => (
                  <div key={application._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{application.scholarshipName}</p>
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

      {/* Payment Plans Tab */}
      {activeTab === 'payment' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Payment Plans</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PAYMENT_PLANS.map((plan) => (
              <div key={plan.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-2xl font-bold text-primary-600 mb-1">{plan.amount}</p>
                <p className="text-gray-600 text-sm mb-4">{plan.frequency}</p>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                
                <div className="space-y-2 mb-4">
                  {plan.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      {benefit}
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => handlePaymentPlan(plan)}
                  className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Select Plan
                </button>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Payment Information</h3>
                <p className="text-blue-800 text-sm mt-1">
                  All payments can be made online through the student portal, by phone, or in person at the bursar's office. 
                  Late payments may incur additional fees.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Payment Plan Requests</h3>
            {recordsLoading ? (
              <p className="text-gray-600">Loading requests...</p>
            ) : recordsError ? (
              <p className="text-red-600">{recordsError}</p>
            ) : paymentPlanRequests.length === 0 ? (
              <p className="text-gray-600">No payment plan requests submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {paymentPlanRequests.map((request) => (
                  <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{request.planName}</p>
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

      {/* Student Loans Tab */}
      {activeTab === 'loans' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Student Loan Options</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {LOAN_OPTIONS.map((loan, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{loan.type}</h3>
                <p className="text-gray-600 mb-4">{loan.description}</p>
                
                <div className="space-y-2 mb-4">
                  {loan.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      {feature}
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-900">Maximum Amount:</p>
                  <p className="text-lg font-semibold text-primary-600">{loan.maxAmount}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-yellow-50 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900">Important Loan Information</h3>
                <p className="text-yellow-800 text-sm mt-1">
                  Before applying for any loan, we recommend completing the FAFSA and exploring all scholarship and grant options first. 
                  Loans must be repaid with interest. Please borrow responsibly.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default FinancialAssistance

