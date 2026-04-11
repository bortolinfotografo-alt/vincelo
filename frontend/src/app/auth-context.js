// Re-exporta do novo local canônico em src/contexts/
// Mantém compatibilidade com imports existentes que usam @/app/auth-context
export { AuthProvider, useAuth } from '@/contexts/auth-context';
