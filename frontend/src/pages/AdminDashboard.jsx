import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="px-6 py-5 border-b border-gray-700">
          <p className="font-bold text-lg">Admin Panel</p>
          <p className="text-xs text-gray-400 mt-1">{user?.full_name}</p>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `block px-3 py-2 rounded text-sm ${isActive ? 'bg-blue-600' : 'hover:bg-gray-700'}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/complaints"
            className={({ isActive }) =>
              `block px-3 py-2 rounded text-sm ${isActive ? 'bg-blue-600' : 'hover:bg-gray-700'}`
            }
          >
            Complaints
          </NavLink>
          <NavLink
            to="/admin/knowledge"
            className={({ isActive }) =>
              `block px-3 py-2 rounded text-sm ${isActive ? 'bg-blue-600' : 'hover:bg-gray-700'}`
            }
          >
            Knowledge Base
          </NavLink>
        </nav>

        <div className="px-4 py-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full text-sm text-gray-400 hover:text-white py-2 text-left"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-8">
        <Outlet />
      </main>
    </div>
  )
}
