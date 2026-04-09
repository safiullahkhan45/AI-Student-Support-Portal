import { useEffect, useRef, useState } from 'react'
import api from '../api/client'
import MessageInput from './MessageInput'

export default function ChatWindow({ tenantId }) {
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  // On mount — load existing session or create a new one
  useEffect(() => {
    const saved = localStorage.getItem('chat_session_id')
    if (saved) {
      setSessionId(saved)
      loadHistory(saved)
    } else {
      createSession()
    }
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  async function createSession() {
    try {
      const res = await api.post('/chat/sessions')
      const id = res.data.id
      setSessionId(id)
      localStorage.setItem('chat_session_id', id)
    } catch (err) {
      setError('Failed to start chat session. Please refresh.')
    }
  }

  async function loadHistory(id) {
    try {
      const res = await api.get(`/chat/sessions/${id}/messages`)
      setMessages(res.data)
    } catch (err) {
      // Session may be expired — create a new one
      localStorage.removeItem('chat_session_id')
      createSession()
    }
  }

  async function handleSend(text) {
    if (!sessionId) return

    // Immediately show user message in UI
    const userMsg = { id: Date.now(), role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setIsTyping(true)
    setError(null)

    try {
      const res = await api.post(`/chat/sessions/${sessionId}/messages`, {
        content: text,
      })
      setMessages((prev) => [...prev, res.data])
    } catch (err) {
      setError('Failed to get a response. Please try again.')
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white px-5 py-3">
        <h2 className="font-semibold text-sm">AI Student Assistant</h2>
        <p className="text-xs text-blue-200">Ask about fees, results, hostel, or academic policies</p>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {/* Empty state */}
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-16">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm font-medium text-gray-500">Hi! How can I help you today?</p>
            <p className="text-xs mt-1">Ask me anything about your university — fees, results, hostel, or academic policies.</p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-2xl rounded-bl-sm text-sm flex items-center gap-1">
              <span className="animate-bounce">●</span>
              <span className="animate-bounce delay-100">●</span>
              <span className="animate-bounce delay-200">●</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center text-xs text-red-500">{error}</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} disabled={isTyping || !sessionId} />
    </div>
  )
}
