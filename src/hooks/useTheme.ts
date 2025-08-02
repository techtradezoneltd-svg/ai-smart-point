import { useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

export const useTheme = () => {
  const { settings } = useSettings();

  useEffect(() => {
    if (settings?.appearance) {
      applyTheme(settings.appearance.theme, settings.appearance.primaryColor);
    }
  }, [settings?.appearance]);

  const applyTheme = (theme: string, primaryColor: string) => {
    const root = document.documentElement;
    
    // Apply theme class
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply custom primary color
    if (primaryColor) {
      root.style.setProperty('--primary', primaryColor);
      root.style.setProperty('--primary-glow', adjustBrightness(primaryColor, 10));
      
      // Update related variables for consistency
      root.style.setProperty('--ring', primaryColor);
      root.style.setProperty('--sidebar-primary', primaryColor);
    }
  };

  const adjustBrightness = (hslColor: string, amount: number) => {
    const match = hslColor.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
    if (match) {
      const [, h, s, l] = match;
      const newL = Math.min(100, Math.max(0, parseInt(l) + amount));
      return `${h} ${s}% ${newL}%`;
    }
    return hslColor;
  };

  return { applyTheme };
};