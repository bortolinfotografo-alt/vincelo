// Re-exporta do novo local canônico em src/contexts/
// Mantém compatibilidade com imports existentes que usam @/app/theme-context
export { ThemeProvider, useTheme } from '@/contexts/theme-context';
