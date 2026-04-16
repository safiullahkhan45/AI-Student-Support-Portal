import { createContext, useContext, useState } from 'react'

const ThemeContext = createContext(null)

function applyTheme(dark) {
  if (dark) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    const isDark = stored === 'dark'
    // Apply immediately so it's in sync with initial state
    applyTheme(isDark)
    return isDark
  })

  function toggle() {
    setDark((prev) => {
      const next = !prev
      applyTheme(next)
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
