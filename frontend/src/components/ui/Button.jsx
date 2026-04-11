'use client';

// ============================================================
// Button — componente reutilizável de botão
// ============================================================

import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600 active:scale-95 disabled:opacity-60',
  secondary: 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600',
  danger: 'bg-red-500 text-white hover:bg-red-600 active:scale-95 disabled:opacity-60',
  ghost: 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
  outline: 'border border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

/**
 * @param {'primary'|'secondary'|'danger'|'ghost'|'outline'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} loading
 * @param {boolean} fullWidth
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) {
  return (
    <button
      disabled={loading || disabled}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-lg font-medium transition-all duration-150
        touch-manipulation
        ${VARIANTS[variant]}
        ${SIZES[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <Loader2 size={14} className="animate-spin flex-shrink-0" />
      )}
      {children}
    </button>
  );
}
