'use client';

// ============================================================
// Spinner — indicador de carregamento
// ============================================================

const SIZES = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-4',
  xl: 'w-16 h-16 border-4',
};

/**
 * @param {'sm'|'md'|'lg'|'xl'} size
 * @param {string} className
 */
export function Spinner({ size = 'md', className = '' }) {
  return (
    <div
      className={`${SIZES[size]} rounded-full border-gray-200 border-t-primary-500 animate-spin ${className}`}
      role="status"
      aria-label="Carregando"
    />
  );
}

/**
 * Spinner centralizado na tela (fullscreen loading)
 */
export function FullPageSpinner() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

/**
 * Skeleton de card genérico
 */
export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={`h-3 bg-gray-100 dark:bg-gray-800 rounded ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
