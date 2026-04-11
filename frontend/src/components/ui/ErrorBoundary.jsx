'use client';

// ============================================================
// ErrorBoundary — captura erros de renderização React
// Exibe UI de fallback em vez de tela branca.
//
// Uso no layout.js:
//   <ErrorBoundary>
//     <AppShell>{children}</AppShell>
//   </ErrorBoundary>
// ============================================================

import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Em produção, enviar para Sentry ou similar:
    // Sentry.captureException(error, { extra: info });
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Algo deu errado
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="text-left text-xs bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mb-4 overflow-auto max-h-40 text-red-600 dark:text-red-400">
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              <RefreshCw size={14} />
              Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
