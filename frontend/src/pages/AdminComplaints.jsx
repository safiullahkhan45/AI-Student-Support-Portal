import { useEffect, useState } from 'react'
import api from '../api/client'

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved']
const CATEGORIES = ['Fee', 'Result', 'Hostel', 'Academic', 'Other']

const statusBadge = {
  open: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([])
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [selected, setSelected] = useState(null)
  const [noteInput, setNoteInput] = useState('')
  const [statusInput, setStatusInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchComplaints() }, [filterStatus, filterCategory])

  async function fetchComplaints() {
    try {
      const params = {}
      if (filterStatus) params.status = filterStatus
      if (filterCategory) params.category = filterCategory
      const res = await api.get('/complaints', { params })
      setComplaints(res.data)
    } catch {
      console.error('Failed to fetch complaints')
    }
  }

  function handleRowClick(complaint) {
    setSelected(complaint)
    setNoteInput(complaint.admin_note || '')
    setStatusInput(complaint.status)
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await api.patch(`/complaints/${selected.id}`, {
        status: statusInput,
        admin_note: noteInput,
      })
      setComplaints((prev) => prev.map((c) => (c.id === selected.id ? res.data : c)))
      setSelected(res.data)
    } catch {
      alert('Failed to save update')
    } finally {
      setSaving(false)
    }
  }

  const selectCls = 'text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Complaints</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review and respond to student complaints.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left — Table */}
        <div className="flex-1 min-w-0">
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectCls}>
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={selectCls}>
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {(filterStatus || filterCategory) && (
              <button
                onClick={() => { setFilterStatus(''); setFilterCategory('') }}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear filters
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
            {complaints.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No complaints found</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {filterStatus || filterCategory ? 'Try clearing the filters.' : 'Student complaints will appear here.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Reference</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {complaints.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => handleRowClick(c)}
                        className={`cursor-pointer transition ${
                          selected?.id === c.id
                            ? 'bg-indigo-50/60 dark:bg-indigo-900/20'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">{c.reference_number}</td>
                        <td className="px-4 py-3.5 text-slate-800 dark:text-slate-200 font-medium">{c.student_name}</td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">{c.category}</td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusBadge[c.status]}`}>
                            {c.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 dark:text-slate-500 text-xs">{new Date(c.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right — Detail Panel */}
        {selected && (
          <div className="w-full lg:w-80 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm space-y-4 lg:self-start">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Complaint Detail</h3>
              <button
                onClick={() => setSelected(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Reference</p>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{selected.reference_number}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Student</p>
                <p className="text-slate-800 dark:text-slate-200">{selected.student_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Category</p>
                <p className="text-slate-800 dark:text-slate-200">{selected.category}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Description</p>
                <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 leading-relaxed">{selected.description}</p>
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Update Status</label>
              <select
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
                className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Admin Note</label>
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                rows={3}
                placeholder="Add a response for the student..."
                className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 bg-white dark:bg-slate-800"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition"
            >
              {saving ? 'Saving...' : 'Save Update'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
