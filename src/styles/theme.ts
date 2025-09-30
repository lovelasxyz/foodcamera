export const THEME_COLORS = {
  primary: '##00c964',
  secondary: '#ffae00',
  background: '#0c0c0d',
  surface: '#141415',
  text: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  border: 'rgba(255, 255, 255, 0.1)',
  success: '#23c265',
  error: '#ff484a',
  surfaceTransparent: 'rgba(255, 255, 255, 0.05)',
  overlay: 'rgba(0, 0, 0, 0.8)',
} as const; 

export const THEME = {
  colors: {
    ...THEME_COLORS,
    rarity: {
      common: '#5067E5',
      rare: '#C52F81',
      epic: '#C03A42',
      legendary: '#DC904B'
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 14
  }
} as const;