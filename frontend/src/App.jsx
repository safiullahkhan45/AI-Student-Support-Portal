import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import StudentPortal from './pages/StudentPortal'
import AdminDashboard from './pages/AdminDashboard'
import AdminHome from './pages/AdminHome'
import AdminComplaints from './pages/AdminComplaints'
import AdminKnowledge from './pages/AdminKnowledge'

export default function App() {
  return (
    <ToastProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public — redirect to dashboard if already logged in */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Student */}
          <Route
            path="/portal"
            element={
              <ProtectedRoute>
                <StudentPortal />
              </ProtectedRoute>
            }
          />

          {/* Admin — nested routes share the sidebar layout */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminHome />} />
            <Route path="complaints" element={<AdminComplaints />} />
            <Route path="knowledge" element={<AdminKnowledge />} />
          </Route>

          {/* Default → login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ToastProvider>
  )
}