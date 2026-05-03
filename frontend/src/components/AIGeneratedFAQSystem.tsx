import React, { useEffect, useMemo, useState } from 'react'
import { Clock, Search } from 'lucide-react'

interface FAQ {
  id: string
  question: string
  answer: string
  category: 'admission' | 'academic' | 'financial' | 'campus'
  lastUpdated: string
  keywords: string[]
}

interface PublishedFaq {
  id: string
  question: string
  answer: string
  answeredAt?: string
}

const DEFAULT_FAQS: FAQ[] = [
  {
    id: '1',
    question: 'What are the admission requirements for undergraduate programs?',
    answer:
      'For undergraduate programs, you need: 1) High school diploma or equivalent, 2) Minimum GPA of 3.0, 3) TOEFL/IELTS for international students (minimum 6.0 in IELTS), 4) Personal statement, 5) Letters of recommendation. Some programs may have additional requirements.',
    category: 'admission',
    lastUpdated: '2 hours ago',
    keywords: ['admission', 'requirements', 'undergraduate', 'GPA', 'TOEFL'],
  },
  {
    id: '2',
    question: 'How do I apply for scholarships?',
    answer:
      'To apply for scholarships: 1) Complete the scholarship application form online, 2) Submit required documents (transcripts, essays, recommendation letters), 3) Meet the eligibility criteria (GPA requirements, enrollment status), 4) Apply before deadlines (typically March 15th for fall semester). Merit-based and need-based scholarships are available.',
    category: 'financial',
    lastUpdated: '1 day ago',
    keywords: ['scholarship', 'financial aid', 'application', 'deadline'],
  },
  {
    id: '3',
    question: 'What is the process for course registration?',
    answer:
      'Course registration process: 1) Log into student portal using your credentials, 2) Check your academic requirements and course catalog, 3) Select courses for upcoming semester, 4) Meet with academic advisor if needed, 5) Pay registration fees, 6) Confirm registration. Registration opens 2 weeks before semester starts.',
    category: 'academic',
    lastUpdated: '3 hours ago',
    keywords: ['registration', 'courses', 'semester', 'academic advisor'],
  },
]

const CATEGORIES = [
  { value: 'all', label: 'All Categories', color: 'bg-slate-700' },
  { value: 'admission', label: 'Admission', color: 'bg-blue-700' },
  { value: 'academic', label: 'Academic', color: 'bg-emerald-700' },
  { value: 'financial', label: 'Financial', color: 'bg-amber-600' },
  { value: 'campus', label: 'Campus', color: 'bg-indigo-700' },
]

const normalizeQuestion = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim()

const resolveCategory = (question: string, answer: string): FAQ['category'] => {
  const text = `${question} ${answer}`.toLowerCase()

  if (text.includes('admission') || text.includes('apply') || text.includes('application')) {
    return 'admission'
  }

  if (text.includes('scholarship') || text.includes('financial') || text.includes('fee') || text.includes('payment')) {
    return 'financial'
  }

  if (text.includes('campus') || text.includes('hostel') || text.includes('transport')) {
    return 'campus'
  }

  return 'academic'
}

const mergeUniqueFaqs = (existingFaqs: FAQ[], incomingFaqs: FAQ[]) => {
  const seen = new Set<string>()
  const merged: FAQ[] = []

  ;[...existingFaqs, ...incomingFaqs].forEach((faq) => {
    const normalized = normalizeQuestion(faq.question)
    if (!normalized || seen.has(normalized)) {
      return
    }

    seen.add(normalized)
    merged.push(faq)
  })

  return merged
}

const AIGeneratedFAQSystem: React.FC = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
  const [faqs, setFaqs] = useState<FAQ[]>(DEFAULT_FAQS)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'admission' | 'academic' | 'financial' | 'campus'>('all')
  const [publishedFaqError, setPublishedFaqError] = useState('')
  const [publishedFaqCount, setPublishedFaqCount] = useState(0)

  useEffect(() => {
    const loadPublishedFaqs = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        return
      }

      try {
        setPublishedFaqError('')
        const response = await fetch(`${apiBaseUrl}/chat/escalations/published-faqs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to load published FAQs')
        }

        const payload = await response.json()
        const incoming = (payload?.faqs || []) as PublishedFaq[]

        const publishedFaqs: FAQ[] = incoming.map((item, index) => ({
          id: `admin-${item.id || index}`,
          question: item.question,
          answer: item.answer,
          category: resolveCategory(item.question, item.answer),
          lastUpdated: item.answeredAt ? new Date(item.answeredAt).toLocaleString() : 'Recently updated',
          keywords: item.question.toLowerCase().split(/\s+/).filter(Boolean),
        }))

        setPublishedFaqCount(publishedFaqs.length)
        setFaqs((prev) => mergeUniqueFaqs(prev, publishedFaqs))
      } catch {
        setPublishedFaqError('Unable to load published FAQs right now')
      }
    }

    void loadPublishedFaqs()
  }, [apiBaseUrl])

  const uniqueFaqs = useMemo(() => mergeUniqueFaqs([], faqs), [faqs])

  const filteredFaqs = uniqueFaqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.keywords.some((keyword) => keyword.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">FAQs</h1>
        <p className="text-gray-600">Find answers to common student questions across admissions, academics, finance, and campus services.</p>
      </div>

      {publishedFaqCount > 0 && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {publishedFaqCount} admin-answered questions are now available in FAQs.
        </div>
      )}

      {publishedFaqError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {publishedFaqError}
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value as 'all' | 'admission' | 'academic' | 'financial' | 'campus')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category.value ? `${category.color} text-white` : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredFaqs.map((faq) => (
          <article key={faq.id} className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-700 capitalize">
                {faq.category}
              </span>
              <span className="flex items-center text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5 mr-1" />
                Updated {faq.lastUpdated}
              </span>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h2>
            <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
          </article>
        ))}

        {!filteredFaqs.length && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            No FAQs found for the selected search/filter.
          </div>
        )}
      </div>
    </div>
  )
}

export default AIGeneratedFAQSystem
