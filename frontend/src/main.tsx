import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { initializeTheme } from './lib/theme'
import './styles/global.css'
import './styles/demo.css'
import './styles/theme.css'
import './styles/members.css'
import './styles/theme-overrides.css'

initializeTheme()

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element was not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
