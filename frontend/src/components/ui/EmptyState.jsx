'use client';

// ============================================================
// EmptyState — estado vazio padronizado
// ============================================================

/**
 * @param {React.ReactNode} icon    - Ícone (componente Lucide ou similar)
 * @param {string}          title   - Título do estado vazio
 * @param {string}          message - Mensagem descritiva
 * @param {React.ReactNode} action  - Botão ou link de ação (opcional)
 */
export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
        {title}
      </h3>
      {message && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          {message}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
