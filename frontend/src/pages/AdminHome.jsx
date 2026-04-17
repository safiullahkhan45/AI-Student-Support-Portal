import { useRef, useState } from 'react'
import api from '../api/client'

export default function AdminHome() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="animate-fade-up">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Dashboard</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Import student data via CSV files.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <CSVImporter
          title="Fee Records"
          description="CSV columns: roll_number, semester, amount_due, amount_paid, due_date, challan_url"
          endpoint="/fees/import"
          icon={
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <CSVImporter
          title="Result Records"
          description="CSV columns: roll_number, semester, course_code, course_name, credit_hours, grade, grade_points"
          endpoint="/results/import"
          icon={
            <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>
    </div>
  )
}

function CSVImporter({ title, description, endpoint, icon }) {
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState(null)

  async function handleImport(e) {
    e.preventDefault()
    const file = fileInputRef.current?.files[0]

    if (!file) { setError('Please select a CSV file.'); return }
    if (!file.name.endsWith('.csv')) { setError('Only .csv files are allowed.'); return }

    const formData = new FormData()
    formData.append('file', file)

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(res.data)
      fileInputRef.current.value = ''
      setFileName(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Import failed. Please check your CSV file.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title} Import</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>

      <form onSubmit={handleImport} className="space-y-3">
        <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition ${
          fileName
            ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
        }`}>
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
            {fileName || 'Choose CSV file...'}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              setError(null)
              setResult(null)
              setFileName(e.target.files[0]?.name || null)
            }}
          />
        </label>

        <button
          type="submit"
          disabled={loading || !fileName}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Importing...
            </span>
          ) : 'Import CSV'}
        </button>
      </form>

      {error && (
        <div className="mt-3 flex items-start gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-xl text-sm">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {result && (
        <div className="mt-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl px-4 py-3 space-y-1">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Import complete
          </div>
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            <span className="font-bold">{result.imported}</span> records imported
          </p>
          {result.skipped > 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              <span className="font-bold">{result.skipped}</span> rows skipped (missing required fields)
            </p>
          )}
          {result.skipped_reasons?.slice(0, 3).map((r, i) => (
            <p key={i} className="text-xs text-slate-400 dark:text-slate-500">— {r}</p>
          ))}
        </div>
      )}
    </div>
  )
}
