import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return children

  if (user) {
    return <Navigate to={user.role === 'student' ? '/portal' : '/admin'} replace />
  }

  return children
}
