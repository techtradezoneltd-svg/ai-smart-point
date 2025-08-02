import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PROFESSIONAL_THEMES, THEME_MODES, getThemeByName, getModeByName, ThemeConfig, ModeConfig } from '@/lib/themes';

interface ThemeContextType {
  currentTheme: ThemeConfig;
  currentMode: ModeConfig;
  isSystemDark: boolean;
  setTheme: (themeName: string) => void;
  setMode: (modeName: string) => void;
  applyTheme: (themeName: string, modeName: string) => void;
  availableThemes: ThemeConfig[];
  availableModes: ModeConfig[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: string;
  initialMode?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  initialTheme = 'default',
  initialMode = 'dark'
}) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(getThemeByName(initialTheme));
  const [currentMode, setCurrentMode] = useState<ModeConfig>(getModeByName(initialMode));
  const [isSystemDark, setIsSystemDark] = useState(false);

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsSystemDark(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply theme to document
  const applyThemeToDocument = (theme: ThemeConfig, mode: ModeConfig) => {
    const root = document.documentElement;
    
    // Remove all theme classes first
    root.classList.remove('dark', 'light');
    
    // Determine if we should use dark mode
    const shouldUseDark = mode.name === 'auto' ? isSystemDark : mode.isDark;
    
    // Apply mode class
    root.classList.add(shouldUseDark ? 'dark' : 'light');
    
    // Apply theme colors
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--primary-glow', theme.primaryGlow);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--accent-glow', theme.accentGlow);
    root.style.setProperty('--success', theme.success);
    root.style.setProperty('--warning', theme.warning);
    root.style.setProperty('--destructive', theme.destructive);
    
    // Update related variables for consistency
    root.style.setProperty('--ring', theme.primary);
    root.style.setProperty('--sidebar-primary', theme.primary);
    root.style.setProperty('--sidebar-ring', theme.primary);
    
    // Store in localStorage for persistence
    localStorage.setItem('pos-theme', theme.name);
    localStorage.setItem('pos-mode', mode.name);
  };

  const setTheme = (themeName: string) => {
    const theme = getThemeByName(themeName);
    setCurrentTheme(theme);
    applyThemeToDocument(theme, currentMode);
  };

  const setMode = (modeName: string) => {
    const mode = getModeByName(modeName);
    setCurrentMode(mode);
    applyThemeToDocument(currentTheme, mode);
  };

  const applyTheme = (themeName: string, modeName: string) => {
    const theme = getThemeByName(themeName);
    const mode = getModeByName(modeName);
    setCurrentTheme(theme);
    setCurrentMode(mode);
    applyThemeToDocument(theme, mode);
  };

  // Load saved theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('pos-theme');
    const savedMode = localStorage.getItem('pos-mode');
    
    if (savedTheme && savedMode) {
      applyTheme(savedTheme, savedMode);
    } else {
      applyThemeToDocument(currentTheme, currentMode);
    }
  }, []);

  // Re-apply theme when system preference changes (for auto mode)
  useEffect(() => {
    if (currentMode.name === 'auto') {
      applyThemeToDocument(currentTheme, currentMode);
    }
  }, [isSystemDark, currentTheme, currentMode]);

  const value: ThemeContextType = {
    currentTheme,
    currentMode,
    isSystemDark,
    setTheme,
    setMode,
    applyTheme,
    availableThemes: PROFESSIONAL_THEMES,
    availableModes: THEME_MODES,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};