import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import ChatWindow from '../components/ChatWindow'
import api from '../api/client'

const TABS = [
  { key: 'chat', label: 'AI Assistant', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> },
  { key: 'fees', label: 'Fee Status', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
  { key: 'results', label: 'My Results', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
  { key: 'complaint', label: 'New Complaint', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> },
  { key: 'track', label: 'My Complaints', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
]

export default function StudentPortal() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('chat')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [logoutConfirm, setLogoutConfirm] = useState(false)

  // Chat sessions
  const [sessions, setSessions] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const chatInitialized = useRef(false)

  useEffect(() => {
    if (activeTab === 'chat' && !chatInitialized.current) {
      chatInitialized.current = true
      loadSessions()
    }
  }, [activeTab])

  async function loadSessions() {
    setSessionsLoading(true)
    try {
      const res = await api.get('/chat/sessions')
      setSessions(res.data)
      if (res.data.length > 0) setCurrentSessionId((prev) => prev ?? res.data[0].id)
    } catch {}
    finally { setSessionsLoading(false) }
  }

  function handleNewChat() {
    setCurrentSessionId(null)
  }

  function handleSessionCreated(session) {
    const newEntry = { id: session.id, title: 'New Chat', created_at: session.created_at }
    setSessions((prev) => [newEntry, ...prev])
    setCurrentSessionId(session.id)
  }

  async function handleDeleteSession(id) {
    try {
      await api.delete(`/chat/sessions/${id}`)
      setSessions((prev) => {
        const remaining = prev.filter((s) => s.id !== id)
        if (currentSessionId === id) setCurrentSessionId(remaining.length > 0 ? remaining[0].id : null)
        return remaining
      })
    } catch {}
  }

  function handleLogout() {
    logout()
    toast('You have been logged out.', 'info')
    navigate('/login')
  }

  const initials = user?.full_name ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : '?'
  const activeTabObj = TABS.find((t) => t.key === activeTab)

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/60 flex flex-col transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">EduPortal AI</p>
              <p className="text-xs text-slate-400">Student Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {TABS.map(({ key, label, icon }, i) => (
            <button key={key} onClick={() => { setActiveTab(key); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition text-left animate-slide-left ${
                activeTab === key
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white'
              }`}
              style={{ animationDelay: `${i * 0.06}s` }}>
              <span className={activeTab === key ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}>{icon}</span>
              {label}
              {activeTab === key && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
            </button>
          ))}
        </nav>

        {/* User card */}
        <div className="px-3 py-4 border-t border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{initials}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => setLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/60 px-4 sm:px-6 h-14 flex items-center gap-4 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">{activeTabObj?.icon}</span>
            <h1 className="text-sm font-bold text-slate-800 dark:text-white">{activeTabObj?.label}</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 pl-2 border-l border-slate-200 dark:border-slate-700">
              <span>Hello,</span>
              <span className="font-semibold text-slate-800 dark:text-white">{user?.full_name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {activeTab === 'chat' && (
            <div key="chat" className="h-full flex animate-fade-in overflow-hidden">
              {/* Sessions sidebar */}
              <div className="w-52 shrink-0 hidden sm:flex flex-col border-r border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900">
                <div className="px-3 pt-3 pb-2 shrink-0">
                  <button
                    onClick={handleNewChat}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Chat
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
                  {sessionsLoading ? (
                    <div className="flex justify-center py-8">
                      <svg className="animate-spin w-4 h-4 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    </div>
                  ) : sessions.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8 px-3 leading-relaxed">No conversations yet.<br />Start one below!</p>
                  ) : (
                    sessions.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => setCurrentSessionId(s.id)}
                        className={`group flex items-start gap-2 px-2 py-2.5 rounded-xl cursor-pointer transition ${
                          currentSessionId === s.id
                            ? 'bg-indigo-50 dark:bg-indigo-900/20'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <svg className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${currentSessionId === s.id ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium leading-snug truncate ${currentSessionId === s.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {s.title}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {new Date(s.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id) }}
                          className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 rounded text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat window */}
              <div className="flex-1 min-w-0 p-4 sm:p-5">
                <ChatWindow
                  sessionId={currentSessionId}
                  onSessionCreated={handleSessionCreated}
                  onMessageSent={loadSessions}
                />
              </div>
            </div>
          )}
          {activeTab === 'fees'      && <div key="fees" className="p-4 sm:p-6 animate-fade-up"><FeeLookup user={user} /></div>}
          {activeTab === 'results'   && <div key="results" className="p-4 sm:p-6 animate-fade-up"><ResultLookup user={user} /></div>}
          {activeTab === 'complaint' && <div key="complaint" className="p-4 sm:p-6 animate-fade-up"><ComplaintSubmit /></div>}
          {activeTab === 'track'     && <div key="track" className="p-4 sm:p-6 animate-fade-up"><ComplaintTrack /></div>}
        </main>
      </div>

      {/* Logout confirmation modal */}
      {logoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setLogoutConfirm(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700/60 w-full max-w-sm p-6 animate-slide-in">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/30 mx-auto mb-4">
              <svg className="w-6 h-6 text-rose-500 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white text-center mb-1">Log out?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">You'll need to sign in again to access your portal.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Shared ────────────────────────────────────────────────────────────────────
const inputCls = 'w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-800 transition'
const labelCls = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5'
const cardCls  = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm'
const btnPrimary = 'w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition'

function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6 animate-fade-up">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function ErrorAlert({ message }) {
  return (
    <div className="mt-4 flex items-center gap-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-xl text-sm">
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {message}
    </div>
  )
}

// ── Shared fee card renderer ───────────────────────────────────────────────────
function FeeCard({ feeRecord, animate = true }) {
  const outstanding = (parseFloat(feeRecord.amount_due) - parseFloat(feeRecord.amount_paid)).toFixed(2)
  const isPaid = parseFloat(outstanding) <= 0
  return (
    <div className={`space-y-3 ${animate ? 'animate-scale-in' : ''}`}>
      <div className={`flex items-center justify-between px-5 py-4 rounded-2xl border ${isPaid ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Semester</p>
          <p className="text-base font-bold text-slate-800 dark:text-white mt-0.5">{feeRecord.semester}</p>
        </div>
        <span className={`text-sm font-bold px-4 py-1.5 rounded-full ${isPaid ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'}`}>
          {isPaid ? '✓ Cleared' : '⚠ Due'}
        </span>
      </div>
      <div className={`${cardCls} overflow-hidden`}>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {[
            { label: 'Total Fee',   value: `PKR ${parseFloat(feeRecord.amount_due).toLocaleString()}`,  cls: 'text-slate-800 dark:text-white' },
            { label: 'Amount Paid', value: `PKR ${parseFloat(feeRecord.amount_paid).toLocaleString()}`, cls: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Outstanding', value: `PKR ${parseFloat(outstanding).toLocaleString()}`,           cls: parseFloat(outstanding) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400', bold: true },
          ].map(({ label, value, cls, bold }) => (
            <div key={label} className="flex justify-between items-center px-5 py-3.5">
              <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
              <span className={`text-sm ${cls} ${bold ? 'font-bold text-base' : 'font-semibold'}`}>{value}</span>
            </div>
          ))}
          {feeRecord.due_date && (
            <div className="flex justify-between items-center px-5 py-3.5">
              <span className="text-sm text-slate-500 dark:text-slate-400">Due Date</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{new Date(feeRecord.due_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          )}
        </div>
        {feeRecord.challan_url && (
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50">
            <a href={feeRecord.challan_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download Challan
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Fee Lookup ─────────────────────────────────────────────────────────────────
function FeeLookup({ user }) {
  // My records (auto-loaded)
  const [myFees, setMyFees] = useState([])
  const [myFeesLoading, setMyFeesLoading] = useState(true)
  const [selectedSemester, setSelectedSemester] = useState(null)

  // Search section
  const [searchOpen, setSearchOpen] = useState(false)
  const [rollNumber, setRollNumber] = useState('')
  const [semester, setSemester] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.roll_number) { setMyFeesLoading(false); return }
    api.get('/fees/my')
      .then((res) => {
        setMyFees(res.data)
        if (res.data.length > 0) setSelectedSemester(res.data[res.data.length - 1].semester)
      })
      .catch(() => {})
      .finally(() => setMyFeesLoading(false))
  }, [user])

  async function handleSearch(e) {
    e.preventDefault(); setLoading(true); setError(null); setSearchResult(null)
    try {
      const res = await api.get('/fees/lookup', { params: { roll_number: rollNumber, semester } })
      setSearchResult(res.data)
    } catch (err) { setError(err.response?.data?.detail || 'Fee record not found') }
    finally { setLoading(false) }
  }

  const activeFee = myFees.find((f) => f.semester === selectedSemester) || null

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title="Fee Status" subtitle="Your semester fee records." />

      {/* ── My Fee Records ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">My Records</p>
        {myFeesLoading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-8 justify-center">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            Loading your records...
          </div>
        ) : myFees.length === 0 ? (
          <div className={`${cardCls} px-5 py-8 text-center text-sm text-slate-400`}>
            {user?.roll_number ? 'No fee records found for your account.' : 'No roll number linked to your account.'}
          </div>
        ) : (
          <>
            {/* Semester tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {myFees.map((f) => (
                <button key={f.semester} onClick={() => setSelectedSemester(f.semester)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
                    selectedSemester === f.semester
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500'
                  }`}>
                  {f.semester}
                </button>
              ))}
            </div>
            {activeFee && <FeeCard feeRecord={activeFee} />}
          </>
        )}
      </div>

      {/* ── Search Section ── */}
      <div className={`${cardCls} overflow-hidden`}>
        <button
          onClick={() => { setSearchOpen((o) => !o); setSearchResult(null); setError(null) }}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Search by Roll Number
          </span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${searchOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        {searchOpen && (
          <div className="border-t border-slate-100 dark:border-slate-700/60 px-5 py-5">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Roll Number</label><input value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="e.g. RIPHAH-001" className={inputCls} required /></div>
                <div><label className={labelCls}>Semester</label><input value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="e.g. Fall 2024" className={inputCls} required /></div>
              </div>
              <button type="submit" disabled={loading} className={btnPrimary}>{loading ? 'Searching...' : 'Check Fee Status'}</button>
            </form>
            {error && <ErrorAlert message={error} />}
            {searchResult && <div className="mt-5"><FeeCard feeRecord={searchResult} /></div>}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Result Lookup ──────────────────────────────────────────────────────────────
const gradeStyle = (g) => {
  if (!g) return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
  if (g.startsWith('A')) return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
  if (g.startsWith('B')) return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
  if (g.startsWith('C')) return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
  if (g === 'F') return 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400'
  return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
}

// ── Shared result card renderer ────────────────────────────────────────────────
function ResultCard({ result, animate = true }) {
  const gpaColor = result.gpa >= 3.5
    ? 'text-emerald-600 dark:text-emerald-400'
    : result.gpa >= 2.5
    ? 'text-blue-600 dark:text-blue-400'
    : 'text-amber-600 dark:text-amber-400'

  return (
    <div className={`space-y-4 ${animate ? 'animate-scale-in' : ''}`}>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'GPA', value: result.gpa.toFixed(2), sub: result.semester, cls: gpaColor },
          { label: 'Courses', value: result.courses.length, sub: 'This semester', cls: 'text-slate-800 dark:text-white' },
          { label: 'Credit Hrs', value: result.courses.reduce((s, c) => s + c.credit_hours, 0), sub: 'Total', cls: 'text-slate-800 dark:text-white' },
        ].map(({ label, value, sub, cls }) => (
          <div key={label} className={`${cardCls} p-5 flex flex-col items-center text-center`}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-4xl font-black ${cls}`}>{value}</p>
            <p className="text-xs text-slate-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>
      <div className={`${cardCls} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700/60">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Course</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide hidden sm:table-cell">Code</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">Hrs</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">Grade</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">GP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {result.courses.map((course) => (
                <tr key={course.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-200">{course.course_name}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-400 hidden sm:table-cell">{course.course_code}</td>
                  <td className="px-5 py-3.5 text-center text-slate-500 dark:text-slate-400">{course.credit_hours}</td>
                  <td className="px-5 py-3.5 text-center"><span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${gradeStyle(course.grade)}`}>{course.grade}</span></td>
                  <td className="px-5 py-3.5 text-center text-slate-500 dark:text-slate-400">{parseFloat(course.grade_points).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ResultLookup({ user }) {
  // My results (auto-loaded)
  const [myResults, setMyResults] = useState([])
  const [myResultsLoading, setMyResultsLoading] = useState(true)
  const [selectedSemester, setSelectedSemester] = useState(null)

  // Search section
  const [searchOpen, setSearchOpen] = useState(false)
  const [rollNumber, setRollNumber] = useState('')
  const [semester, setSemester] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.roll_number) { setMyResultsLoading(false); return }
    api.get('/results/my')
      .then((res) => {
        setMyResults(res.data)
        if (res.data.length > 0) setSelectedSemester(res.data[res.data.length - 1].semester)
      })
      .catch(() => {})
      .finally(() => setMyResultsLoading(false))
  }, [user])

  async function handleSearch(e) {
    e.preventDefault(); setLoading(true); setError(null); setSearchResult(null)
    try {
      const res = await api.get('/results/lookup', { params: { roll_number: rollNumber, semester } })
      setSearchResult(res.data)
    } catch (err) { setError(err.response?.data?.detail || 'Results not found') }
    finally { setLoading(false) }
  }

  const activeResult = myResults.find((r) => r.semester === selectedSemester) || null

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="My Results" subtitle="Your semester transcript and GPA." />

      {/* ── My Results ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">My Records</p>
        {myResultsLoading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-8 justify-center">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            Loading your results...
          </div>
        ) : myResults.length === 0 ? (
          <div className={`${cardCls} px-5 py-8 text-center text-sm text-slate-400`}>
            {user?.roll_number ? 'No results found for your account.' : 'No roll number linked to your account.'}
          </div>
        ) : (
          <>
            {/* Semester tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {myResults.map((r) => (
                <button key={r.semester} onClick={() => setSelectedSemester(r.semester)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
                    selectedSemester === r.semester
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500'
                  }`}>
                  {r.semester}
                </button>
              ))}
            </div>
            {activeResult && <ResultCard result={activeResult} />}
          </>
        )}
      </div>

      {/* ── Search Section ── */}
      <div className={`${cardCls} overflow-hidden`}>
        <button
          onClick={() => { setSearchOpen((o) => !o); setSearchResult(null); setError(null) }}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Search by Roll Number
          </span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${searchOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        {searchOpen && (
          <div className="border-t border-slate-100 dark:border-slate-700/60 px-5 py-5">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Roll Number</label><input value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="e.g. RIPHAH-001" className={inputCls} required /></div>
                <div><label className={labelCls}>Semester</label><input value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="e.g. Fall 2024" className={inputCls} required /></div>
              </div>
              <button type="submit" disabled={loading} className={btnPrimary}>{loading ? 'Loading...' : 'View Results'}</button>
            </form>
            {error && <ErrorAlert message={error} />}
            {searchResult && <div className="mt-5"><ResultCard result={searchResult} /></div>}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Complaint Submit ───────────────────────────────────────────────────────────
const CATEGORIES = ['Fee', 'Result', 'Hostel', 'Academic', 'Other']

function ComplaintSubmit() {
  const [category, setCategory] = useState(CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [refNumber, setRefNumber] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (description.trim().length < 10) { setError('Description must be at least 10 characters.'); return }
    setLoading(true); setError(null)
    try {
      const res = await api.post('/complaints', { category, description: description.trim() })
      setRefNumber(res.data.reference_number); setDescription('')
    } catch (err) { setError(err.response?.data?.detail || 'Failed to submit complaint') }
    finally { setLoading(false) }
  }

  function handleCopy() { navigator.clipboard.writeText(refNumber); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  if (refNumber) return (
    <div className="max-w-lg">
      <div className={`${cardCls} p-8 text-center`}>
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Complaint Submitted!</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-7">Your complaint is being reviewed. Save your reference number to track progress.</p>
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-6 py-4 flex items-center justify-between mb-6">
          <span className="font-mono font-bold text-slate-800 dark:text-white text-lg tracking-widest">{refNumber}</span>
          <button onClick={handleCopy} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${copied ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/60'}`}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <button onClick={() => setRefNumber(null)} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition">← Submit another complaint</button>
      </div>
    </div>
  )

  return (
    <div className="max-w-lg">
      <PageHeader title="New Complaint" subtitle="Describe your issue and we'll look into it." />
      <div className={`${cardCls} p-6`}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelCls}>Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
                    category === c
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <span className={`text-xs font-medium ${description.length > 0 && description.length < 10 ? 'text-rose-500' : 'text-slate-400'}`}>{description.length} chars</span>
            </div>
            <textarea value={description} onChange={(e) => { setDescription(e.target.value); setError(null) }} rows={5}
              placeholder="Describe your issue in detail..."
              className={`${inputCls} resize-none ${description.length > 0 && description.length < 10 ? 'border-rose-300 dark:border-rose-600 focus:ring-rose-400' : ''}`} required />
          </div>
          <button type="submit" disabled={loading || description.trim().length < 10} className={btnPrimary}>
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>
        {error && <div className="mt-4 flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{error}</div>}
      </div>
    </div>
  )
}

// ── Complaint Track ────────────────────────────────────────────────────────────
const statusConfig = {
  open:        { label: 'Open',        cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',   dot: 'bg-amber-400' },
  in_progress: { label: 'In Progress', cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',       dot: 'bg-blue-400' },
  resolved:    { label: 'Resolved',    cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-400' },
}

function ComplaintTrack() {
  const [complaints, setComplaints] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/complaints/my').then((res) => setComplaints(res.data)).catch(() => setError('Failed to load complaints')).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center py-24 gap-2 text-slate-400 text-sm"><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Loading...</div>
  if (error) return <div className="text-center py-24 text-rose-500 text-sm">{error}</div>

  return (
    <div className="max-w-2xl">
      <PageHeader title="My Complaints" subtitle={`${complaints.length} complaint${complaints.length !== 1 ? 's' : ''} submitted`} />
      {complaints.length === 0 ? (
        <div className={`${cardCls} p-14 text-center`}>
          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <p className="font-semibold text-slate-700 dark:text-slate-300">No complaints yet</p>
          <p className="text-sm text-slate-400 mt-1">Your submitted complaints will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c, i) => {
            const st = statusConfig[c.status] || statusConfig.open
            const isOpen = selected?.id === c.id
            return (
              <div key={c.id} className={`bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-sm transition animate-fade-up ${isOpen ? 'border-indigo-300 dark:border-indigo-600' : 'border-slate-200 dark:border-slate-700/60'}`} style={{ animationDelay: `${i * 0.07}s` }}>
                <button className="w-full text-left px-5 py-4" onClick={() => setSelected(isOpen ? null : c)}>
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-slate-800 dark:text-white text-sm">{c.category}</span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-slate-400">{c.reference_number}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 dark:border-slate-700/60 px-5 py-4 bg-slate-50/60 dark:bg-slate-800/40 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Your complaint</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{c.description}</p>
                    </div>
                    {c.admin_note ? (
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">Admin Response</p>
                        </div>
                        <p className="text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed">{c.admin_note}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Awaiting admin response...
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
