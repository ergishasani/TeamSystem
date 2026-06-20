export const colors = {
  ink: '#202020',
  paper: '#f2f3f5',
  white: '#ffffff',
  lime: '#c9f158',
  surface1: '#ffffff',
  surface2: '#ebecee',
  surface3: '#dee0e3',
  label: '#202020',
  labelSecondary: '#6b6e74',
  labelTertiary: '#a1a4ab',
  separator: 'rgba(32,32,32,0.06)',
  destructive: '#e85b5b',
  success: '#6db347',
  warning: '#e8b54a',
  info: '#4a85e8',
  categories: {
    wellness: '#d4b8ff',
    fitness: '#c9f158',
    food: '#ffb86b',
    travel: '#9bd3ff',
    learning: '#ffd66b',
    health: '#ff9aa8',
  },
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 28,
  '2xl': 32,
  '3xl': 40,
  pill: 999,
} as const;

export const spacing = {
  screenX: 20,
  sectionGap: 24,
  cardPad: 20,
  rowY: 14,
} as const;

export const fonts = {
  regular: 'SpaceGrotesk_400Regular',
  medium: 'SpaceGrotesk_500Medium',
  semiBold: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
} as const;

export const categoryColor = (cat: string): string =>
  (colors.categories as Record<string, string>)[cat] ?? colors.lime;
