import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ChatWindow from '../components/ChatWindow'
import api from '../api/client'

export default function StudentPortal() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('chat')

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

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white shrink-0">
        {['chat', 'fees', 'results'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium capitalize border-b-2 transition ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'chat' ? 'AI Chat' : tab === 'fees' ? 'Fee Lookup' : 'Results'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="h-full max-w-3xl w-full mx-auto px-4 py-6">
            <ChatWindow />
          </div>
        )}
        {activeTab === 'fees' && <FeeLookup />}
        {activeTab === 'results' && <ResultLookup />}
      </main>
    </div>
  )
}

function FeeLookup() {
  const [rollNumber, setRollNumber] = useState('')
  const [semester, setSemester] = useState('')
  const [feeRecord, setFeeRecord] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSearch(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setFeeRecord(null)
    try {
      const res = await api.get('/fees/lookup', { params: { roll_number: rollNumber, semester } })
      setFeeRecord(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Fee record not found')
    } finally {
      setLoading(false)
    }
  }

  const outstanding = feeRecord
    ? (parseFloat(feeRecord.amount_due) - parseFloat(feeRecord.amount_paid)).toFixed(2)
    : null

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Fee Lookup</h2>
      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
          <input
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            placeholder="e.g. RIPHAH-001"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
          <input
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            placeholder="e.g. Fall 2024"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {feeRecord && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            Fee Status — {feeRecord.semester}
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Due</span>
              <span className="font-medium">PKR {parseFloat(feeRecord.amount_due).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Paid</span>
              <span className="font-medium text-green-600">PKR {parseFloat(feeRecord.amount_paid).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-gray-700 font-medium">Outstanding Balance</span>
              <span className={`font-bold ${parseFloat(outstanding) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                PKR {parseFloat(outstanding).toLocaleString()}
              </span>
            </div>
            {feeRecord.due_date && (
              <div className="flex justify-between">
                <span className="text-gray-500">Due Date</span>
                <span className="font-medium">{new Date(feeRecord.due_date).toLocaleDateString()}</span>
              </div>
            )}
            {feeRecord.challan_url && (
              <a
                href={feeRecord.challan_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm transition"
              >
                Download Challan
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ResultLookup() {
  const [rollNumber, setRollNumber] = useState('')
  const [semester, setSemester] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSearch(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await api.get('/results/lookup', { params: { roll_number: rollNumber, semester } })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Results not found')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Result Lookup</h2>
      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
          <input
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            placeholder="e.g. RIPHAH-001"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
          <input
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            placeholder="e.g. Fall 2024"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">
              Results — {result.semester}
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">Code</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">Course</th>
                <th className="px-4 py-3 text-center text-gray-500 font-medium">Hours</th>
                <th className="px-4 py-3 text-center text-gray-500 font-medium">Grade</th>
                <th className="px-4 py-3 text-center text-gray-500 font-medium">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {result.courses.map((course) => (
                <tr key={course.id}>
                  <td className="px-4 py-3 text-gray-600">{course.course_code}</td>
                  <td className="px-4 py-3 text-gray-800">{course.course_name}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{course.credit_hours}</td>
                  <td className="px-4 py-3 text-center font-medium text-blue-600">{course.grade}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{parseFloat(course.grade_points).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right font-semibold text-gray-700">
                  Semester GPA
                </td>
                <td className="px-4 py-3 text-center font-bold text-blue-600 text-base">
                  {result.gpa.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}