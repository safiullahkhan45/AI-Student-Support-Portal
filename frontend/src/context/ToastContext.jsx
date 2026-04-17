import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

const ICONS = {
  success: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
}

const STYLES = {
  success: {
    wrap: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700',
    icon: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50',
    text: 'text-emerald-800 dark:text-emerald-200',
    close: 'text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300',
  },
  error: {
    wrap: 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-700',
    icon: 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/50',
    text: 'text-rose-800 dark:text-rose-200',
    close: 'text-rose-400 hover:text-rose-600 dark:hover:text-rose-300',
  },
  info: {
    wrap: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700',
    icon: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50',
    text: 'text-blue-800 dark:text-blue-200',
    close: 'text-blue-400 hover:text-blue-600 dark:hover:text-blue-300',
  },
  warning: {
    wrap: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700',
    icon: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50',
    text: 'text-amber-800 dark:text-amber-200',
    close: 'text-amber-400 hover:text-amber-600 dark:hover:text-amber-300',
  },
}

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const s = STYLES[t.type] || STYLES.info
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg shadow-black/5 text-sm font-medium max-w-xs w-full animate-slide-in ${s.wrap}`}
          >
            <span className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${s.icon}`}>
              {ICONS[t.type] || ICONS.info}
            </span>
            <span className={`flex-1 leading-snug ${s.text}`}>{t.message}</span>
            <button onClick={() => onDismiss(t.id)} className={`shrink-0 transition ${s.close}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  function dismiss(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
