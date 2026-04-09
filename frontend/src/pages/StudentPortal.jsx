import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ChatWindow from '../components/ChatWindow'

export default function StudentPortal() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    localStorage.removeItem('chat_session_id')
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between shadow shrink-0">
        <span className="text-lg font-semibold">AI Student Portal</span>
        <div className="flex items-center gap-4">
          <span className="text-sm">Hello, {user?.full_name}</span>
          <button
            onClick={handleLogout}
            className="bg-white text-blue-600 text-sm px-3 py-1 rounded hover:bg-blue-50 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Chat Area */}
      <main className="flex-1 overflow-hidden max-w-3xl w-full mx-auto px-4 py-6">
        <ChatWindow />
      </main>
    </div>
  )
}