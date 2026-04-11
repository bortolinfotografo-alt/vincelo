import Script from 'next/script';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import Providers from './providers';
import './globals.css';

export const metadata = {
  title: 'Vincelo — Rede social do audiovisual',
  description: 'Conecte-se com os melhores fotógrafos, videomakers e criadores do Brasil.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vincelo',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#f97316',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col bg-white">
        {/* Remove dark antes do primeiro paint — evita tela preta no mobile */}
        <Script id="remove-dark" strategy="beforeInteractive">
          {`document.documentElement.classList.remove('dark')`}
        </Script>
        <ErrorBoundary>
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
