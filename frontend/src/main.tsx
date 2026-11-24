import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <Toaster
          position="top-right"
          gutter={10}
          toastOptions={{
            duration: 3500,
            className: 'rht-toast',
            success: {
              iconTheme: { primary: 'var(--success)', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: 'var(--danger)', secondary: '#fff' },
            },
          }}
        />
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)