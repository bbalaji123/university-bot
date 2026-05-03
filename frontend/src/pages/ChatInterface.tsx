import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import MicRoundedIcon from '@mui/icons-material/MicRounded'
import StopRoundedIcon from '@mui/icons-material/StopRounded'
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded'
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ThumbUpOffAltRoundedIcon from '@mui/icons-material/ThumbUpOffAltRounded'
import ThumbDownOffAltRoundedIcon from '@mui/icons-material/ThumbDownOffAltRounded'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  sentiment?: 'positive' | 'negative' | 'neutral'
  confidence?: number
  sourceQuestion?: string
  feedbackVote?: 'up' | 'down'
}

interface ChatHistoryTurn {
  sender: 'user' | 'bot'
  text: string
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'te', name: 'Telugu' }
]

const QUICK_REPLIES = [
  'What are admission dates?',
  'Explain hostel fees',
  'Scholarship eligibility',
  'Placement training details',
  'Library timings',
  'Transport information'
]

const API_BASE_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8000'
const APP_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
const RAG_FALLBACK_THRESHOLD = Number(import.meta.env.VITE_RAG_CONFIDENCE_THRESHOLD || 0.45)

type LanguageCode = 'en' | 'hi' | 'te'

interface ISpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onstart: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

interface SpeechRecognitionEvent extends Event {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string
      }
    }
    length: number
  }
}

interface SpeechRecognitionErrorEvent extends Event {
  error:
    | 'aborted'
    | 'audio-capture'
    | 'bad-grammar'
    | 'language-not-supported'
    | 'network'
    | 'no-speech'
    | 'not-allowed'
    | 'service-not-allowed'
    | string
}

interface ChatEscalation {
  id: string
  question: string
  status: string
  answer: string
  answeredAt?: string
  studentRead?: boolean
}

type SpeechCtor = new () => ISpeechRecognition

const getSpeechRecognition = (): SpeechCtor | null => {
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechCtor
    webkitSpeechRecognition?: SpeechCtor
  }

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null
}

const mapSpeechError = (errorCode: string) => {
  switch (errorCode) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone permission is blocked. Allow microphone access in your browser settings and try again.'
    case 'audio-capture':
      return 'No microphone was detected. Check your audio input device and try again.'
    case 'language-not-supported':
      return 'Selected language is not supported for voice input in this browser. Switch to English and try again.'
    case 'network':
      if (!navigator.onLine) {
        return 'Voice recognition service is unavailable because your device appears offline. Please check your internet and try again.'
      }

      if (!window.isSecureContext) {
        return 'Voice recognition may be blocked because this page is not running in a secure context. Use https:// (or localhost) and try again.'
      }

      return 'Voice recognition service is unavailable. Your browser privacy settings may be blocking required storage/cookies for speech services (for example, Tracking Prevention or blocked third-party cookies). Allow site access and try again.'
    case 'aborted':
      return 'Voice recording was interrupted. Please try again.'
    case 'no-speech':
      return 'No speech detected. Try speaking closer to the microphone.'
    default:
      return 'Voice capture failed. Please try again.'
  }
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const URL_PATTERN = /(https?:\/\/[^\s]+)/gi

const renderMessageText = (text: string, isUser: boolean) => {
  const parts = text.split(URL_PATTERN)

  return parts.map((part, partIndex) => {
    const isUrl = /^https?:\/\//i.test(part)
    if (isUrl) {
      return (
        <Box
          key={`url-${partIndex}-${part}`}
          component="a"
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: isUser ? '#dbeafe' : '#2563eb',
            textDecoration: 'underline',
            wordBreak: 'break-all',
          }}
        >
          {part}
        </Box>
      )
    }

    const lines = part.split('\n')
    return (
      <React.Fragment key={`txt-${partIndex}`}>
        {lines.map((line, lineIndex) => (
          <React.Fragment key={`line-${partIndex}-${lineIndex}`}>
            {line}
            {lineIndex < lines.length - 1 ? <br /> : null}
          </React.Fragment>
        ))}
      </React.Fragment>
    )
  })
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en')
  const [voiceOutEnabled, setVoiceOutEnabled] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [pendingEscalationQuestion, setPendingEscalationQuestion] = useState<string | null>(null)
  const [isEscalating, setIsEscalating] = useState(false)
  const [escalationNotice, setEscalationNotice] = useState<string | null>(null)
  const [feedbackLoadingByMessage, setFeedbackLoadingByMessage] = useState<Record<string, boolean>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const manualStopRef = useRef(false)
  const isRecordingRef = useRef(false)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const voiceOutEnabledRef = useRef(true)
  const suggestionsAbortRef = useRef<AbortController | null>(null)

  const placeholder = useMemo(() => {
    if (selectedLanguage === 'hi') return 'अपना संदेश लिखें...'
    if (selectedLanguage === 'te') return 'మీ సందేశాన్ని టైప్ చేయండి...'
    return 'Type your message...'
  }, [selectedLanguage])

  useEffect(() => {
    setMessages([
      {
        id: 'welcome-1',
        text: 'Hello! I am your AI university assistant. Ask me about admissions, academics, fees, campus services, placements, and student support.',
        sender: 'bot',
        timestamp: new Date(),
      },
    ])
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    isRecordingRef.current = isRecording
  }, [isRecording])

  useEffect(() => {
    voiceOutEnabledRef.current = voiceOutEnabled
    if (!voiceOutEnabled && currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }
  }, [voiceOutEnabled])

  useEffect(() => {
    return () => {
      manualStopRef.current = true
      recognitionRef.current?.stop()
      recognitionRef.current = null
      suggestionsAbortRef.current?.abort()
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current.currentTime = 0
        currentAudioRef.current = null
      }
    }
  }, [])

  const loadAnswerNotifications = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    const notificationsResponse = await fetch(`${APP_API_BASE_URL}/chat/escalations/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!notificationsResponse.ok) {
      return
    }

    const notificationsPayload = await notificationsResponse.json()
    const unreadCount = Number(notificationsPayload?.unreadCount || 0)
    if (unreadCount <= 0) {
      return
    }

    const escalationsResponse = await fetch(`${APP_API_BASE_URL}/chat/escalations/mine?status=answered`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!escalationsResponse.ok) {
      return
    }

    const escalationsPayload = await escalationsResponse.json()
    const unreadEscalations: ChatEscalation[] = (escalationsPayload?.escalations || []).filter(
      (item: ChatEscalation) => item.answer && item.studentRead === false
    )

    if (!unreadEscalations.length) {
      return
    }

    setMessages((prev) => {
      const existingIds = new Set(prev.map((message) => message.id))
      const notificationMessages: Message[] = unreadEscalations
        .filter((item) => !existingIds.has(`escalation-answer-${item.id}`))
        .map((item) => ({
          id: `escalation-answer-${item.id}`,
          sender: 'bot',
          timestamp: item.answeredAt ? new Date(item.answeredAt) : new Date(),
          text: `Admin answered your question: ${item.answer}`,
        }))

      return [...prev, ...notificationMessages]
    })

    setEscalationNotice(
      unreadEscalations.length === 1
        ? 'You have 1 new admin response to your escalated question.'
        : `You have ${unreadEscalations.length} new admin responses to escalated questions.`
    )

    await Promise.all(
      unreadEscalations.map((item) =>
        fetch(`${APP_API_BASE_URL}/chat/escalations/${item.id}/read`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => null)
      )
    )
  }

  useEffect(() => {
    let mounted = true

    const run = async () => {
      if (!mounted) return
      await loadAnswerNotifications()
    }

    void run()
    const timer = window.setInterval(() => {
      void run()
    }, 20000)

    return () => {
      mounted = false
      window.clearInterval(timer)
    }
  }, [])

  const submitEscalation = async (question: string) => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('Please login again to submit your question to admin.')
      return
    }

    try {
      setIsEscalating(true)
      const response = await fetch(`${APP_API_BASE_URL}/chat/escalations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question,
          language: selectedLanguage,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || 'Failed to submit question to admin')
      }

      const payload = await response.json()
      setPendingEscalationQuestion(null)
      setEscalationNotice(payload?.message || 'Question sent to admin successfully.')
      setMessages((prev) => [
        ...prev,
        {
          id: `escalation-ack-${Date.now()}`,
          sender: 'bot',
          timestamp: new Date(),
          text: 'Acknowledged. Your question has been sent to admin. You will receive a notification when the answer is ready.',
        },
      ])
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Failed to submit question')
    } finally {
      setIsEscalating(false)
    }
  }

  const playReplyAudio = async (text: string, language: LanguageCode) => {
    if (!voiceOutEnabledRef.current) {
      return
    }

    const response = await fetch(`${API_BASE_URL}/speech/synthesize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, language }),
    })

    if (!response.ok) {
      throw new Error('Speech synthesis failed')
    }

    const data = await response.json()
    const raw = atob(data.audio_base64 || '')
    const bytes = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i += 1) {
      bytes[i] = raw.charCodeAt(i)
    }

    const mimeType = data?.mime_type || 'audio/wav'
    const audioBlob = new Blob([bytes.buffer], { type: mimeType })
    const audioUrl = URL.createObjectURL(audioBlob)

    if (!voiceOutEnabledRef.current) {
      URL.revokeObjectURL(audioUrl)
      return
    }

    const audio = new Audio(audioUrl)
    currentAudioRef.current = audio
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl)
      if (currentAudioRef.current === audio) {
        currentAudioRef.current = null
      }
    }

    audio.onpause = () => {
      if (audio.currentTime === 0) {
        URL.revokeObjectURL(audioUrl)
      }
      if (currentAudioRef.current === audio) {
        currentAudioRef.current = null
      }
    }

    await audio.play()
  }

  const handleSendMessage = async (overrideText?: string) => {
    const outgoing = (overrideText ?? inputText).trim()
    if (!outgoing || isTyping) {
      return
    }

    setError(null)
    const userMessage: Message = {
      id: `u-${Date.now()}`,
      text: outgoing,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText('')
    setSuggestions([])
    setActiveSuggestionIndex(0)
    setIsTyping(true)

    const requestLanguage = selectedLanguage
    const recentHistory: ChatHistoryTurn[] = messages
      .slice(-8)
      .map((item) => ({ sender: item.sender, text: item.text }))

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: outgoing, language: requestLanguage, history: recentHistory }),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        throw new Error(errorPayload?.detail || 'Failed to get assistant response')
      }

      const payload = await response.json()
      const botText = payload?.reply || 'Please contact university administration.'
      const botConfidence = Number(payload?.confidence || 0)
      const botMessage: Message = {
        id: String(`b-${Date.now()}`),
        text: botText,
        sender: 'bot',
        timestamp: new Date(),
        sentiment: payload?.sentiment,
        confidence: botConfidence,
        sourceQuestion: outgoing,
      }

      setMessages((prev) => [...prev, botMessage])
      if (botConfidence < RAG_FALLBACK_THRESHOLD) {
        setPendingEscalationQuestion(outgoing)
      }
      try {
        await playReplyAudio(botText, requestLanguage)
      } catch {
        // Keep text response visible even if audio playback fails.
      }
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Failed to send message')
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickReply = (reply: string) => {
    void handleSendMessage(reply)
  }

  const submitFeedback = async (message: Message, vote: 'up' | 'down') => {
    if (message.sender !== 'bot' || !message.sourceQuestion?.trim()) {
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      setError('Please login again to submit feedback.')
      return
    }

    try {
      setFeedbackLoadingByMessage((prev) => ({ ...prev, [message.id]: true }))
      const response = await fetch(`${APP_API_BASE_URL}/chat/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          responseId: message.id,
          question: message.sourceQuestion,
          reply: message.text,
          vote,
          language: selectedLanguage,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || 'Failed to submit feedback')
      }

      setMessages((prev) =>
        prev.map((item) => (item.id === message.id ? { ...item, feedbackVote: vote } : item))
      )
    } catch (feedbackError) {
      setError(feedbackError instanceof Error ? feedbackError.message : 'Failed to submit feedback')
    } finally {
      setFeedbackLoadingByMessage((prev) => ({ ...prev, [message.id]: false }))
    }
  }

  const applySuggestion = (suggestion: string) => {
    const compact = inputText.replace(/\s+$/, '')
    if (!compact) {
      setInputText(`${suggestion} `)
      setSuggestions([])
      setActiveSuggestionIndex(0)
      return
    }

    const tokens = compact.split(/\s+/)
    tokens[tokens.length - 1] = suggestion
    setInputText(`${tokens.join(' ')} `)
    setSuggestions([])
    setActiveSuggestionIndex(0)
  }

  useEffect(() => {
    const query = inputText.trim()
    if (!query) {
      setSuggestions([])
      setActiveSuggestionIndex(0)
      suggestionsAbortRef.current?.abort()
      suggestionsAbortRef.current = null
      return
    }

    const timer = window.setTimeout(async () => {
      try {
        suggestionsAbortRef.current?.abort()
        const controller = new AbortController()
        suggestionsAbortRef.current = controller

        const response = await fetch(`${API_BASE_URL}/suggest?q=${encodeURIComponent(query)}&limit=6`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          setSuggestions([])
          setActiveSuggestionIndex(0)
          return
        }

        const payload = await response.json()
        const nextSuggestions = Array.isArray(payload?.suggestions)
          ? payload.suggestions.filter((item: unknown) => typeof item === 'string' && item.trim())
          : []

        setSuggestions(nextSuggestions)
        setActiveSuggestionIndex(0)
      } catch {
        setSuggestions([])
        setActiveSuggestionIndex(0)
      }
    }, 140)

    return () => {
      window.clearTimeout(timer)
    }
  }, [inputText])

  const toggleRecording = async () => {
    setError(null)

    try {
      const SpeechRecognition = getSpeechRecognition()
      if (!SpeechRecognition) {
        throw new Error('Speech recognition is not supported in this browser.')
      }

      if (!isRecording) {
        const recognition = new SpeechRecognition()
        recognition.lang = selectedLanguage === 'hi' ? 'hi-IN' : selectedLanguage === 'te' ? 'te-IN' : 'en-IN'
        recognition.continuous = true
        recognition.maxAlternatives = 1
        recognition.interimResults = false
        manualStopRef.current = false

        recognition.onstart = () => {
          setIsRecording(true)
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0]?.[0]?.transcript?.trim() || ''
          if (transcript) {
            setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript))
          }
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          const message = mapSpeechError(event?.error || '')
          setError(message)
          manualStopRef.current = true
          recognitionRef.current = null
          setIsRecording(false)
        }

        recognition.onend = () => {
          if (!manualStopRef.current && isRecordingRef.current) {
            try {
              recognition.start()
              return
            } catch {
              // Ignore restart errors and close recording gracefully.
            }
          }

          recognitionRef.current = null
          setIsRecording(false)
        }

        recognition.start()
        recognitionRef.current = recognition
        return
      }

      manualStopRef.current = true
      recognitionRef.current?.stop()
      recognitionRef.current = null
      setIsRecording(false)
    } catch (voiceError) {
      setError(voiceError instanceof Error ? voiceError.message : 'Voice capture failed')
    }
  }

  const handleLanguageChange = (event: SelectChangeEvent<LanguageCode>) => {
    setSelectedLanguage(event.target.value as LanguageCode)
  }

  const isSendDisabled = !inputText.trim() || isTyping
  const speechSupported = Boolean(getSpeechRecognition())

  return (
    <Paper
      elevation={0}
      sx={{
        height: 'calc(100vh - 110px)',
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid #e5e7eb',
          bgcolor: '#ffffff',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: '#0ea5e9' }}>
              <SmartToyRoundedIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 18 }}>
                AI University Chatbot
              </Typography>
              <Typography variant="caption" color="success.main">
                Semantic RAG Assistant Online
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            <FormControl size="small" sx={{ minWidth: 135 }}>
              <Select
                value={selectedLanguage}
                onChange={handleLanguageChange}
                startAdornment={<TranslateRoundedIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />}
              >
                {LANGUAGES.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>{lang.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Tooltip title={voiceOutEnabled ? 'Disable voice output' : 'Enable voice output'}>
              <IconButton
                onClick={() => {
                  setVoiceOutEnabled((prev) => {
                    const next = !prev
                    if (!next && currentAudioRef.current) {
                      currentAudioRef.current.pause()
                      currentAudioRef.current.currentTime = 0
                      currentAudioRef.current = null
                    }
                    return next
                  })
                }}
              >
                {voiceOutEnabled ? <VolumeUpRoundedIcon /> : <VolumeOffRoundedIcon />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      {error && (
        <Box sx={{ px: 2, pt: 1.5 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      {escalationNotice && (
        <Box sx={{ px: 2, pt: 1.5 }}>
          <Alert severity="success" onClose={() => setEscalationNotice(null)}>
            {escalationNotice}
          </Alert>
        </Box>
      )}

      <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2, bgcolor: '#f8fafc' }}>
        <Stack spacing={1.5}>
          {messages.map((message) => {
            const isUser = message.sender === 'user'
            return (
              <Stack key={message.id} direction="row" justifyContent={isUser ? 'flex-end' : 'flex-start'}>
                <Stack
                  direction={isUser ? 'row-reverse' : 'row'}
                  spacing={1}
                  sx={{ maxWidth: { xs: '92%', md: '72%' } }}
                >
                  <Avatar sx={{ width: 32, height: 32, bgcolor: isUser ? '#2563eb' : '#334155' }}>
                    {isUser ? <PersonRoundedIcon sx={{ fontSize: 18 }} /> : <SmartToyRoundedIcon sx={{ fontSize: 18 }} />}
                  </Avatar>
                  <Paper
                    elevation={0}
                    sx={{
                      px: 1.5,
                      py: 1,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: isUser ? '#bfdbfe' : '#e2e8f0',
                      bgcolor: isUser ? '#2563eb' : '#ffffff',
                      color: isUser ? '#ffffff' : '#0f172a',
                    }}
                  >
                    <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {renderMessageText(message.text, isUser)}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ mt: 0.75, alignItems: 'center', flexWrap: 'wrap' }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: isUser ? 'rgba(255,255,255,0.85)' : 'text.secondary' }}
                      >
                        {formatTime(message.timestamp)}
                      </Typography>

                      {!isUser && message.sourceQuestion && (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Tooltip title="Helpful">
                            <span>
                              <IconButton
                                size="small"
                                color={message.feedbackVote === 'up' ? 'success' : 'default'}
                                onClick={() => {
                                  void submitFeedback(message, 'up')
                                }}
                                disabled={Boolean(feedbackLoadingByMessage[message.id])}
                              >
                                <ThumbUpOffAltRoundedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Not helpful">
                            <span>
                              <IconButton
                                size="small"
                                color={message.feedbackVote === 'down' ? 'error' : 'default'}
                                onClick={() => {
                                  void submitFeedback(message, 'down')
                                }}
                                disabled={Boolean(feedbackLoadingByMessage[message.id])}
                              >
                                <ThumbDownOffAltRoundedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      )}
                    </Stack>
                  </Paper>
                </Stack>
              </Stack>
            )
          })}

          {isTyping && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#334155' }}>
                <SmartToyRoundedIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Paper elevation={0} sx={{ px: 1.5, py: 1, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">Thinking...</Typography>
                </Stack>
              </Paper>
            </Stack>
          )}

          <div ref={messagesEndRef} />
        </Stack>
      </Box>

      <Box sx={{ px: 2, pt: 1.5, pb: 1, borderTop: '1px solid #e5e7eb', bgcolor: '#ffffff' }}>
        {pendingEscalationQuestion && (
          <Alert
            severity="warning"
            sx={{ mb: 1.2 }}
            onClose={() => {
              if (!isEscalating) {
                setPendingEscalationQuestion(null)
              }
            }}
            action={
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Button
                  size="small"
                  color="inherit"
                  variant="outlined"
                  onClick={() => {
                    void submitEscalation(pendingEscalationQuestion)
                  }}
                  disabled={isEscalating}
                >
                  {isEscalating ? 'Submitting...' : 'Send To Admin'}
                </Button>
                <IconButton
                  size="small"
                  color="inherit"
                  aria-label="Dismiss"
                  onClick={() => {
                    if (!isEscalating) {
                      setPendingEscalationQuestion(null)
                    }
                  }}
                  disabled={isEscalating}
                >
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            }
          >
            Did not find the answer? Send this question to admin for a verified response.
          </Alert>
        )}

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 1.25 }}>
          {QUICK_REPLIES.map((reply) => (
            <Chip
              key={reply}
              label={reply}
              onClick={() => handleQuickReply(reply)}
              clickable
              variant="outlined"
            />
          ))}
        </Stack>

        <Box sx={{ position: 'relative' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === 'Tab' && suggestions.length > 0) {
                e.preventDefault()
                const selected = suggestions[Math.min(activeSuggestionIndex, suggestions.length - 1)]
                if (selected) {
                  applySuggestion(selected)
                }
                return
              }

              if (e.key === 'ArrowDown' && suggestions.length > 0) {
                e.preventDefault()
                setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length)
                return
              }

              if (e.key === 'ArrowUp' && suggestions.length > 0) {
                e.preventDefault()
                setActiveSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
                return
              }

              if (e.key === 'Escape' && suggestions.length > 0) {
                e.preventDefault()
                setSuggestions([])
                setActiveSuggestionIndex(0)
                return
              }

              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleSendMessage()
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title={isRecording ? 'Stop voice input' : 'Start voice input'}>
                    <span>
                      <IconButton
                        color={isRecording ? 'error' : 'default'}
                        onClick={() => {
                          void toggleRecording()
                        }}
                        disabled={!speechSupported}
                      >
                        {isRecording ? <StopRoundedIcon /> : <MicRoundedIcon />}
                      </IconButton>
                    </span>
                  </Tooltip>

                  <Tooltip title="Send message">
                    <span>
                      <IconButton
                        color="primary"
                        onClick={() => {
                          void handleSendMessage()
                        }}
                        disabled={isSendDisabled}
                      >
                        <SendRoundedIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />

          {suggestions.length > 0 && (
            <Paper
              elevation={3}
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 'calc(100% + 6px)',
                zIndex: 20,
                maxHeight: 220,
                overflowY: 'auto',
                border: '1px solid #dbeafe',
              }}
            >
              <List dense sx={{ py: 0.5 }}>
                {suggestions.map((suggestion, index) => (
                  <ListItemButton
                    key={`${suggestion}-${index}`}
                    selected={index === activeSuggestionIndex}
                    onMouseDown={(event) => {
                      event.preventDefault()
                      applySuggestion(suggestion)
                    }}
                  >
                    <ListItemText
                      primary={suggestion}
                      secondary={index === 0 ? 'Press Tab to auto-complete' : undefined}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          )}
        </Box>

        {isRecording && (
          <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
            Voice input is active. Tap stop to finish.
          </Typography>
        )}
      </Box>
    </Paper>
  )
}

export default ChatInterface
