'use client';

import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './auth-context';
import { ThemeProvider } from './theme-context';

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <Toaster position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  );
}
