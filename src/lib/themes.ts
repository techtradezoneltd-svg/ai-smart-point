export interface ThemeConfig {
  name: string;
  displayName: string;
  primary: string;
  primaryGlow: string;
  accent: string;
  accentGlow: string;
  success: string;
  warning: string;
  destructive: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    background: string;
  };
}

export interface ModeConfig {
  name: string;
  displayName: string;
  description: string;
  isDark: boolean;
}

export const THEME_MODES: ModeConfig[] = [
  {
    name: 'light',
    displayName: 'Light Mode',
    description: 'Clean and bright interface',
    isDark: false,
  },
  {
    name: 'dark',
    displayName: 'Dark Mode', 
    description: 'Modern dark interface',
    isDark: true,
  },
  {
    name: 'auto',
    displayName: 'System Default',
    description: 'Follows your system preference',
    isDark: false, // Will be determined by system
  },
];

export const PROFESSIONAL_THEMES: ThemeConfig[] = [
  {
    name: 'default',
    displayName: 'Professional Purple',
    primary: '263 70% 60%',
    primaryGlow: '263 70% 70%',
    accent: '197 100% 55%',
    accentGlow: '197 100% 65%',
    success: '142 76% 45%',
    warning: '45 93% 60%',
    destructive: '0 84% 60%',
    description: 'Modern and professional',
    preview: {
      primary: 'hsl(263, 70%, 60%)',
      secondary: 'hsl(197, 100%, 55%)',
      background: 'hsl(222, 84%, 4.9%)',
    },
  },
  {
    name: 'ocean-blue',
    displayName: 'Ocean Blue',
    primary: '221 83% 53%',
    primaryGlow: '221 83% 63%',
    accent: '199 89% 48%',
    accentGlow: '199 89% 58%',
    success: '142 76% 45%',
    warning: '45 93% 60%',
    destructive: '0 84% 60%',
    description: 'Calm and trustworthy',
    preview: {
      primary: 'hsl(221, 83%, 53%)',
      secondary: 'hsl(199, 89%, 48%)',
      background: 'hsl(222, 84%, 4.9%)',
    },
  },
  {
    name: 'forest-green',
    displayName: 'Forest Green',
    primary: '142 76% 45%',
    primaryGlow: '142 76% 55%',
    accent: '160 84% 39%',
    accentGlow: '160 84% 49%',
    success: '142 76% 45%',
    warning: '45 93% 60%',
    destructive: '0 84% 60%',
    description: 'Natural and eco-friendly',
    preview: {
      primary: 'hsl(142, 76%, 45%)',
      secondary: 'hsl(160, 84%, 39%)',
      background: 'hsl(222, 84%, 4.9%)',
    },
  },
  {
    name: 'sunset-orange',
    displayName: 'Sunset Orange',
    primary: '25 95% 53%',
    primaryGlow: '25 95% 63%',
    accent: '43 96% 56%',
    accentGlow: '43 96% 66%',
    success: '142 76% 45%',
    warning: '45 93% 60%',
    destructive: '0 84% 60%',
    description: 'Warm and energetic',
    preview: {
      primary: 'hsl(25, 95%, 53%)',
      secondary: 'hsl(43, 96%, 56%)',
      background: 'hsl(222, 84%, 4.9%)',
    },
  },
  {
    name: 'ruby-red',
    displayName: 'Ruby Red',
    primary: '0 84% 60%',
    primaryGlow: '0 84% 70%',
    accent: '346 77% 49%',
    accentGlow: '346 77% 59%',
    success: '142 76% 45%',
    warning: '45 93% 60%',
    destructive: '0 84% 60%',
    description: 'Bold and confident',
    preview: {
      primary: 'hsl(0, 84%, 60%)',
      secondary: 'hsl(346, 77%, 49%)',
      background: 'hsl(222, 84%, 4.9%)',
    },
  },
  {
    name: 'royal-purple',
    displayName: 'Royal Purple',
    primary: '262 83% 58%',
    primaryGlow: '262 83% 68%',
    accent: '280 100% 70%',
    accentGlow: '280 100% 80%',
    success: '142 76% 45%',
    warning: '45 93% 60%',
    destructive: '0 84% 60%',
    description: 'Elegant and luxurious',
    preview: {
      primary: 'hsl(262, 83%, 58%)',
      secondary: 'hsl(280, 100%, 70%)',
      background: 'hsl(222, 84%, 4.9%)',
    },
  },
  {
    name: 'midnight-blue',
    displayName: 'Midnight Blue',
    primary: '237 100% 68%',
    primaryGlow: '237 100% 78%',
    accent: '200 100% 70%',
    accentGlow: '200 100% 80%',
    success: '142 76% 45%',
    warning: '45 93% 60%',
    destructive: '0 84% 60%',
    description: 'Deep and sophisticated',
    preview: {
      primary: 'hsl(237, 100%, 68%)',
      secondary: 'hsl(200, 100%, 70%)',
      background: 'hsl(222, 84%, 4.9%)',
    },
  },
  {
    name: 'emerald-teal',
    displayName: 'Emerald Teal',
    primary: '173 80% 40%',
    primaryGlow: '173 80% 50%',
    accent: '180 100% 35%',
    accentGlow: '180 100% 45%',
    success: '142 76% 45%',
    warning: '45 93% 60%',
    destructive: '0 84% 60%',
    description: 'Fresh and innovative',
    preview: {
      primary: 'hsl(173, 80%, 40%)',
      secondary: 'hsl(180, 100%, 35%)',
      background: 'hsl(222, 84%, 4.9%)',
    },
  },
  {
    name: 'rose-pink',
    displayName: 'Rose Pink',
    primary: '326 78% 66%',
    primaryGlow: '326 78% 76%',
    accent: '340 82% 52%',
    accentGlow: '340 82% 62%',
    success: '142 76% 45%',
    warning: '45 93% 60%',
    destructive: '0 84% 60%',
    description: 'Soft and creative',
    preview: {
      primary: 'hsl(326, 78%, 66%)',
      secondary: 'hsl(340, 82%, 52%)',
      background: 'hsl(222, 84%, 4.9%)',
    },
  },
];

export const getThemeByName = (name: string): ThemeConfig => {
  return PROFESSIONAL_THEMES.find(theme => theme.name === name) || PROFESSIONAL_THEMES[0];
};

export const getModeByName = (name: string): ModeConfig => {
  return THEME_MODES.find(mode => mode.name === name) || THEME_MODES[0];
};