import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SettingsProvider } from './contexts/SettingsContext.tsx'
import { ThemeProvider } from './components/ThemeProvider'

createRoot(document.getElementById("root")!).render(
  <SettingsProvider>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </SettingsProvider>
);
