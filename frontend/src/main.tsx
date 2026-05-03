import React from 'react'
import ReactDOM from 'react-dom/client'
import { CssBaseline, GlobalStyles, ThemeProvider, createTheme } from '@mui/material'
import App from './App.tsx'
import './index.css'

export type ThemeMode = 'light' | 'dark'

export const ThemeModeContext = React.createContext<{
  mode: ThemeMode
  toggleMode: () => void
}>({
  mode: 'light',
  toggleMode: () => undefined,
})

const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = React.useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('theme-mode')
    return savedMode === 'dark' ? 'dark' : 'light'
  })

  const toggleMode = React.useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme-mode', next)
      return next
    })
  }, [])

  const appTheme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#0f766e',
          },
          secondary: {
            main: '#0ea5e9',
          },
          background:
            mode === 'light'
              ? {
                  default: '#f3f4f6',
                  paper: '#ffffff',
                }
              : {
                  default: '#0f172a',
                  paper: '#111827',
                },
        },
        shape: {
          borderRadius: 14,
        },
        typography: {
          fontFamily: '"Source Sans 3", "Segoe UI", sans-serif',
          h1: { fontFamily: '"Fraunces", serif' },
          h2: { fontFamily: '"Fraunces", serif' },
          h3: { fontFamily: '"Fraunces", serif' },
          h4: { fontFamily: '"Fraunces", serif' },
        },
      }),
    [mode]
  )

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            body:
              mode === 'light'
                ? {
                    background:
                      'radial-gradient(circle at 8% 10%, rgba(14,165,233,0.16), transparent 30%), radial-gradient(circle at 95% 10%, rgba(15,118,110,0.14), transparent 30%), #f3f4f6',
                  }
                : {
                    background:
                      'radial-gradient(circle at 8% 10%, rgba(14,165,233,0.12), transparent 30%), radial-gradient(circle at 95% 10%, rgba(15,118,110,0.1), transparent 30%), #0f172a',
                  },
          }}
        />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppThemeProvider>
      <App />
    </AppThemeProvider>
  </React.StrictMode>,
)
