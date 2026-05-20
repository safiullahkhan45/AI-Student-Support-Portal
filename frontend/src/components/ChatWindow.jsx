import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import api from '../api/client'
import MessageInput from './MessageInput'

export default function ChatWindow({ sessionId, onSessionCreated, onMessageSent }) {
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)
  const sending = useRef(false)  // true while a lazy session creation + send is in-flight

  useEffect(() => {
    // Skip the reset if we're mid-send (session was just lazily created)
    if (sending.current) return
    setMessages([])
    setError(null)
    if (sessionId) loadHistory(sessionId)
  }, [sessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  async function loadHistory(id) {
    try {
      const res = await api.get(`/chat/sessions/${id}/messages`)
      setMessages(res.data)
    } catch {
      setError('Failed to load chat history.')
    }
  }

  async function handleSend(text) {
    let sid = sessionId

    // Lazily create a session on the very first message
    if (!sid) {
      sending.current = true  // block useEffect from resetting messages
      try {
        const res = await api.post('/chat/sessions')
        sid = res.data.id
        if (onSessionCreated) onSessionCreated(res.data)
      } catch {
        sending.current = false
        setError('Failed to start a chat session.')
        return
      }
    }

    const wasEmpty = messages.length === 0
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', content: text }])
    setIsTyping(true)
    setError(null)

    try {
      const res = await api.post(`/chat/sessions/${sid}/messages`, { content: text })
      setMessages((prev) => [...prev, res.data])
      if (wasEmpty && onMessageSent) onMessageSent()
    } catch {
      setError('Failed to get a response. Please try again.')
    } finally {
      setIsTyping(false)
      sending.current = false  // allow future session switches to reset normally
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">AI Student Assistant</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Powered by your university knowledge base</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-slate-400 dark:text-slate-500">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">How can I help you today?</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">Ask me about fees, results, hostel, academic policies, or anything else from your university.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {['What are the fee deadlines?', 'How do I apply for hostel?', 'What is the grading policy?'].map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-xs text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-800 px-3 py-1.5 rounded-full transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 animate-slide-up ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            )}
            <div
              className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm whitespace-pre-wrap'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm'
              }`}
            >
              {msg.role === 'user' ? (
                msg.content
              ) : (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>,
                    h1: ({ children }) => <h1 className="text-base font-bold text-slate-900 dark:text-white mt-3 mb-1 first:mt-0">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1 first:mt-0">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-2 mb-1 first:mt-0">{children}</h3>,
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 mb-2">{children}</ol>,
                    li: ({ children }) => <li className="text-slate-700 dark:text-slate-300">{children}</li>,
                    code: ({ inline, children }) =>
                      inline ? (
                        <code className="bg-slate-200 dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                      ) : (
                        <pre className="bg-slate-200 dark:bg-slate-700 rounded-lg p-3 mt-2 mb-2 overflow-x-auto">
                          <code className="text-xs font-mono text-slate-800 dark:text-slate-200">{children}</code>
                        </pre>
                      ),
                    hr: () => <hr className="border-slate-300 dark:border-slate-600 my-2" />,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="text-xs text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 px-3 py-2 rounded-xl">{error}</div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <MessageInput onSend={handleSend} disabled={isTyping} />
    </div>
  )
}
