import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { toast } = useToast()

  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirmPassword: '',
    roll_number: '', tenant_id: '00000000-0000-0000-0000-000000000001',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError('')
    try {
      await api.post('/auth/register', {
        full_name: form.full_name, email: form.email, password: form.password,
        roll_number: form.roll_number || null, tenant_id: form.tenant_id,
      })
      const profile = await login(form.email, form.password, form.tenant_id)
      toast(`Account created! Welcome, ${profile.full_name.split(' ')[0]}!`, 'success')
      navigate(profile.role === 'student' ? '/portal' : '/admin', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  const inputCls = 'w-full border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent bg-white/10 backdrop-blur-sm transition'
  const labelCls = 'block text-sm font-semibold text-indigo-100 mb-1.5'

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-48 -right-24 w-[600px] h-[600px] bg-violet-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-indigo-300/10 rounded-full blur-2xl pointer-events-none" />

      {/* ── Left — Branding ── */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-between p-14 relative">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="font-bold text-lg text-white tracking-tight">EduPortal AI</span>
        </div>

        {/* Headline + features */}
        <div>
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-white/90 uppercase tracking-wide">Join thousands of students</span>
          </div>
          <h1 className="text-5xl font-black text-white leading-tight mb-5 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Join your university<br />
            <span className="text-indigo-200">student portal.</span>
          </h1>
          <p className="text-indigo-200 text-lg leading-relaxed mb-10 max-w-md animate-fade-up" style={{ animationDelay: '0.3s' }}>
            Create your account to access AI support, fee records, results, and complaint tracking — all in one place.
          </p>

          <div className="space-y-3">
            {[
              { icon: '🤖', text: 'Instant answers from the AI chatbot' },
              { icon: '💳', text: 'View your fee status and results anytime' },
              { icon: '📝', text: 'Submit and track complaints easily' },
              { icon: '🎓', text: 'Semester-wise GPA and transcript access' },
            ].map(({ icon, text }, i) => (
              <div key={text} className="flex items-center gap-3 animate-fade-up" style={{ animationDelay: `${0.35 + i * 0.08}s` }}>
                <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-base shrink-0">{icon}</div>
                <span className="text-indigo-100 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          {[
            { label: 'Students', value: '2,400+' },
            { label: 'Queries Answered', value: '18K+' },
            { label: 'Complaints Resolved', value: '99%' },
          ].map(({ label, value }, i) => (
            <div key={label} className="flex-1 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4 animate-fade-up" style={{ animationDelay: `${0.7 + i * 0.08}s` }}>
              <p className="text-2xl font-black text-white mb-0.5">{value}</p>
              <p className="text-xs text-indigo-200">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right — Form ── */}
      <div className="flex-1 lg:max-w-[480px] flex items-center justify-center px-6 py-10 relative">

        <div className="relative w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="font-bold text-xl text-white">EduPortal AI</span>
          </div>

          {/* Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl shadow-black/20 px-8 py-9 animate-scale-in" style={{ animationDelay: '0.15s' }}>
            <div className="mb-7">
              <h2 className="text-2xl font-black text-white mb-1">Create your account</h2>
              <p className="text-indigo-200 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-white font-semibold hover:underline">Sign in</Link>
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-rose-400/20 border border-rose-300/30 text-rose-100 px-4 py-3 rounded-2xl mb-5 text-sm">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Full Name</label>
                <input type="text" name="full_name" value={form.full_name} onChange={handleChange} required placeholder="e.g. Ali Hassan" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email Address</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@university.edu" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>
                  Roll Number
                  <span className="ml-1.5 text-xs font-normal text-slate-400">(optional)</span>
                </label>
                <input type="text" name="roll_number" value={form.roll_number} onChange={handleChange} placeholder="e.g. RIPHAH-001" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Password</label>
                  <input type="password" name="password" value={form.password} onChange={handleChange} required placeholder="Min 6 chars" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Confirm</label>
                  <input
                    type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required placeholder="Repeat"
                    className={`${inputCls} ${form.confirmPassword && form.confirmPassword !== form.password ? 'border-rose-400/60 focus:ring-rose-400/50' : ''}`}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>
                  Institution ID
                  <span className="ml-1.5 text-xs font-normal text-slate-400">provided by your university</span>
                </label>
                <input type="text" name="tenant_id" value={form.tenant_id} onChange={handleChange} required className={`${inputCls} font-mono text-xs`} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white hover:bg-indigo-50 disabled:opacity-60 disabled:cursor-not-allowed text-indigo-700 font-semibold py-3 rounded-2xl text-sm transition shadow-lg shadow-black/10 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Creating account...
                  </span>
                ) : 'Create Account →'}
              </button>
            </form>
          </div>

          <p className="text-center text-indigo-300 text-xs mt-6">© 2025 EduPortal AI. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
