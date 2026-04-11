'use client';

// ============================================================
// Badge — etiqueta de status/categoria
// ============================================================

const VARIANTS = {
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
};

const JOB_STATUS_VARIANT = {
  OPEN: 'green',
  IN_PROGRESS: 'blue',
  COMPLETED: 'gray',
  CANCELLED: 'red',
};

const JOB_STATUS_LABEL = {
  OPEN: 'Aberta',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
};

const PROPOSAL_STATUS_VARIANT = {
  PENDING: 'yellow',
  ACCEPTED: 'green',
  REJECTED: 'red',
};

const PROPOSAL_STATUS_LABEL = {
  PENDING: 'Pendente',
  ACCEPTED: 'Aceita',
  REJECTED: 'Recusada',
};

/**
 * @param {'green'|'red'|'yellow'|'blue'|'gray'|'primary'} variant
 */
export function Badge({ children, variant = 'gray', className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function JobStatusBadge({ status }) {
  return (
    <Badge variant={JOB_STATUS_VARIANT[status] || 'gray'}>
      {JOB_STATUS_LABEL[status] || status}
    </Badge>
  );
}

export function ProposalStatusBadge({ status }) {
  return (
    <Badge variant={PROPOSAL_STATUS_VARIANT[status] || 'gray'}>
      {PROPOSAL_STATUS_LABEL[status] || status}
    </Badge>
  );
}
